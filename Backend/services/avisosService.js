const { Op } = require('sequelize');
const {Suscripcion, Socio, Persona,Notificacion}= require('../models')
const {enviarCorreo} = require('./correoService');

function fechaEnZona(fecha, zona) {
  const partes = new Intl.DateTimeFormat('en-US', {
    timeZone: zona,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(fecha)
  const obtener = (tipo) =>
    partes.find((parte)=> parte.type===tipo).value;
  return `${obtener('year')}-${obtener('month')}-${obtener('day')}`
}

// Ventana de avisos: desde hoy (inclusive) hasta hoy + AVISOS_DIAS_ANTES.
// Una suscripción creada con vencimiento dentro de la ventana también entra,
// aunque su día exacto ya haya pasado.
function ventanaAvisos(ahora= new Date()) {
  const dias= Number(process.env.AVISOS_DIAS_ANTES ?? 5)
  const zona= process.env.AVISOS_TIMEZONE||'America/Buenos_Aires'
  if (!Number.isSafeInteger(dias) || dias < 1) {
    throw new Error('AVISOS_DIAS_ANTES debe ser un entero positivo.')
  }

  const desde= fechaEnZona(ahora, zona)
  const fecha= new Date(`${desde}T00:00:00Z`)
  fecha.setUTCDate(fecha.getUTCDate()+dias);

  return { desde, hasta: fecha.toISOString().slice(0,10) };
}

function calcularFechaObjetivo(ahora= new Date()) {
  return ventanaAvisos(ahora).hasta;
}

async function obtenerSuscripcionesParaAvisar(ahora = new Date()){
  const { desde, hasta } = ventanaAvisos(ahora)

  return Suscripcion.findAll({
    where: {
      fechaVencimiento: { [Op.between]: [desde, hasta] },
      estado: 'Vigente'
    },
    include: [{
      model:Socio,
      required:true,
      where: {estado:'Activo'},
      include: [{
        model: Persona,
        required: true
      }]
    }],
    order: [['fechaVencimiento', 'ASC']]
  })
}

function generarMensaje(suscripcion){
  const persona= suscripcion.Socio.Persona;
  const [anio, mes, dia]=suscripcion.fechaVencimiento.split('-')

  return {
    destinatario: persona.email,
    asunto: 'PowerGym: aviso de vencimiento de tu cuota',
    mensaje:
      `Hola ${persona.nombre},\n\n`+`Tu cuota de PowerGym vence el ${dia}/${mes}/${anio}.\n`+'Recordá realizar el pago para renovar tu suscripción.\n\n'+'Si ya realizaste el pago, comunicate con recepción.\n\n'+'Saludos,\nEquipo PowerGym'
  };
}


// Vencimiento más próximo de cada persona. Las suscripciones llegan
// ordenadas por fechaVencimiento ASC, así que la primera que aparece
// de una persona es la que manda para el resto de la ventana.
function vencimientoMasProximoPorPersona(suscripciones) {
  const vencimientoPorPersona= new Map()
  for (const suscripcion of suscripciones) {
    const personaId= suscripcion.Socio.Persona.personaId
    if (!vencimientoPorPersona.has(personaId)) {
      vencimientoPorPersona.set(personaId, suscripcion.fechaVencimiento)
    }
  }
  return vencimientoPorPersona
}

// Personas que ya tienen su aviso para el vencimiento que se está por
// avisar: cubre la clave nueva (personaId:fechaVencimiento) y también las
// suscripciones que ya recibieron su correo con claves anteriores.
async function personasYaAvisadas(suscripciones) {
  const avisadas= new Set()
  if (!suscripciones.length) return avisadas

  const vencimientoPorPersona= vencimientoMasProximoPorPersona(suscripciones)
  const claves= [...vencimientoPorPersona]
    .map(([personaId, vencimiento])=> `${personaId}:${vencimiento}`)
  const suscripcionesIds= suscripciones.map((suscripcion)=> suscripcion.suscripcionId)
  const personaDeSuscripcion= new Map(
    suscripciones.map((suscripcion)=> [
      suscripcion.suscripcionId,
      String(suscripcion.Socio.Persona.personaId)
    ])
  )

  const [avisadasPorClave, avisadasPorSuscripcion]= await Promise.all([
    Notificacion.findAll({
      where: { estado: 'Enviado', claveEnvio: claves },
      attributes: ['claveEnvio']
    }),
    Notificacion.findAll({
      where: { estado: 'Enviado', suscripcionId: suscripcionesIds },
      attributes: ['suscripcionId']
    })
  ])

  for (const notificacion of avisadasPorClave) {
    avisadas.add(String(notificacion.claveEnvio.split(':')[0]))
  }

  for (const notificacion of avisadasPorSuscripcion) {
    const personaId= personaDeSuscripcion.get(notificacion.suscripcionId)
    if (personaId) avisadas.add(personaId)
  }

  return avisadas
}


async function procesarAvisos({ahora= new Date(),enviar= enviarCorreo}= {}) {
  const suscripciones=await obtenerSuscripcionesParaAvisar(ahora)
  const zona= process.env.AVISOS_TIMEZONE|| 'America/Buenos_Aires'
  const fechaActual= fechaEnZona(ahora, zona)
  const resumen= {enviados: 0,omitidos: 0,errores: 0
  }

  // Un solo aviso por vencimiento: la clave usa el vencimiento más próximo
  // de la persona, así los días siguientes, mientras la suscripción siga
  // dentro de la ventana, el aviso ya figura como enviado y se omite.
  const vencimientoPorPersona= vencimientoMasProximoPorPersona(suscripciones)
  const yaAvisadas= await personasYaAvisadas(suscripciones)

  for (const suscripcion of suscripciones) {
    const personaId= suscripcion.Socio.Persona.personaId

    if (yaAvisadas.has(String(personaId))) {
      resumen.omitidos++
      continue
    }

    const claveEnvio =`${personaId}:${vencimientoPorPersona.get(personaId)}`
    const correo = generarMensaje(suscripcion)
    let notificacion

    try {
      notificacion = await Notificacion.create({
        suscripcionId: suscripcion.suscripcionId,claveEnvio, mensaje: correo.mensaje, fechaProgramada: fechaActual, estado: 'Pendiente'
      })
    }catch(error) {
      if (error.name=== 'SequelizeUniqueConstraintError') {
        resumen.omitidos++
        continue
      }
      throw error
    }

    try {
      await enviar(correo)
    }catch(error) {
      await notificacion.update({
        estado:'Error'
      })

      console.error(`Falló el aviso de la suscripción ${suscripcion.suscripcionId}:`,error.message)
      resumen.errores++
      continue
    }

    await notificacion.update({
      estado: 'Enviado',fechaEnvio: fechaActual
    })
    yaAvisadas.add(String(personaId))
    resumen.enviados++
  }
  return resumen
}


module.exports = {fechaEnZona, ventanaAvisos, calcularFechaObjetivo, obtenerSuscripcionesParaAvisar, generarMensaje, personasYaAvisadas, procesarAvisos}