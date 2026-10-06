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


async function procesarAvisos({ahora= new Date(),enviar= enviarCorreo}= {}) {
  const suscripciones=await obtenerSuscripcionesParaAvisar(ahora)
  const zona= process.env.AVISOS_TIMEZONE|| 'America/Buenos_Aires'
  const fechaActual= fechaEnZona(ahora, zona)
  const resumen= {enviados: 0,omitidos: 0,errores: 0
  }
  for (const suscripcion of suscripciones) {
    const claveEnvio =`${suscripcion.Socio.Persona.personaId}:${fechaActual}`
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
    resumen.enviados++
  }
  return resumen
}


module.exports = {fechaEnZona, ventanaAvisos, calcularFechaObjetivo, obtenerSuscripcionesParaAvisar, generarMensaje, procesarAvisos}