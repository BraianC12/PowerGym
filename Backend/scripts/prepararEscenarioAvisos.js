// node scripts/prepararEscenarioAvisos.js
// Vacía la base de datos de prueba (conserva a Dueño y Laura) y siembra un
// escenario de vencimientos para verificar qué avisos se calculan y cómo se redacta el mensaje.

const { Op } = require('sequelize');
const { sequelize, Persona, Administrador, Socio, Suscripcion, Notificacion, Membresia } = require('../models');
const { calcularFechaObjetivo, obtenerSuscripcionesParaAvisar, generarMensaje, fechaEnZona } = require('../services/avisosService');

const CONSERVAR_PERSONAS = [13, 14];
const CONSERVAR_ADMINS = [13, 14];

const OBJETIVO = calcularFechaObjetivo();

// "Ayer" calculado en la zona del sistema: queda fuera de la ventana actual.
function calcularAyer() {
  const fecha = new Date(`${fechaEnZona(new Date(), process.env.AVISOS_TIMEZONE || 'America/Buenos_Aires')}T00:00:00Z`);
  fecha.setUTCDate(fecha.getUTCDate() - 1);
  return fecha.toISOString().slice(0, 10);
}

const AYER = calcularAyer();

const CASOS = [
  {
    nombre: 'Ana', apellido: 'Díaz', email: 'ana@example.com',
    estadoSocio: 'Activo', vencimiento: OBJETIVO, estadoSuscripcion: 'Vigente',
    esperado: true, motivo: 'vence justo el día objetivo'
  },
  {
    nombre: 'Luis', apellido: 'Sosa', email: 'luis@example.com',
    estadoSocio: 'Activo', vencimiento: '2026-10-12', estadoSuscripcion: 'Vigente',
    esperado: false, motivo: 'vence un día después del objetivo'
  },
  {
    nombre: 'María', apellido: 'Paz', email: 'maria@example.com',
    estadoSocio: 'Inactivo', vencimiento: OBJETIVO, estadoSuscripcion: 'Vigente',
    esperado: false, motivo: 'socio inactivo'
  },
  {
    nombre: 'Pedro', apellido: 'Ruiz', email: 'pedro@example.com',
    estadoSocio: 'Activo', vencimiento: OBJETIVO, estadoSuscripcion: 'Cancelada',
    esperado: false, motivo: 'suscripción cancelada'
  },
  {
    nombre: 'Sofía', apellido: 'León', email: 'sofia@example.com',
    estadoSocio: 'Activo', vencimiento: OBJETIVO, estadoSuscripcion: 'Vigente',
    esperado: true, motivo: 'vence justo el día objetivo'
  },
  {
    nombre: 'Nico', apellido: 'Vera', email: 'nico@example.com',
    estadoSocio: 'Activo', vencimiento: AYER, estadoSuscripcion: 'Vigente',
    esperado: false, motivo: 'vence antes del inicio de la ventana'
  }
];

async function vaciar() {
  await sequelize.transaction(async (transaction) => {
    await Notificacion.destroy({ where: {}, transaction });
    await Suscripcion.destroy({ where: {}, transaction });
    await Socio.destroy({ where: {}, transaction });
    await Membresia.destroy({ where: {}, transaction });
    await Administrador.destroy({ where: { administradorId: { [Op.notIn]: CONSERVAR_ADMINS } }, transaction });
    await Persona.destroy({ where: { personaId: { [Op.notIn]: CONSERVAR_PERSONAS } }, transaction });
  });
}

async function sembrar() {
  const sembrados = [];
  for (const caso of CASOS) {
    const persona = await Persona.create({ nombre: caso.nombre, apellido: caso.apellido, email: caso.email });
    await Socio.create({ socioId: persona.personaId, estado: caso.estadoSocio, fechaAlta: '2026-10-01' });
    await Suscripcion.create({
      socioId: persona.personaId,
      fechaInicio: '2026-09-11',
      fechaVencimiento: caso.vencimiento,
      estado: caso.estadoSuscripcion
    });
    sembrados.push({ ...caso, personaId: persona.personaId });
  }
  return sembrados;
}

async function simular() {
  const obtenidas = await obtenerSuscripcionesParaAvisar();
  const reales = new Map(obtenidas.map((s) => [s.Socio.Persona.email, s]));
  let fallos = 0;

  console.log(`\nFecha objetivo: ${OBJETIVO} (AVISOS_DIAS_ANTES=${process.env.AVISOS_DIAS_ANTES ?? 5})`);
  console.log('Quién dispara un aviso:\n');
  console.log('  caso                          esperado   calculado   resultado');

  for (const caso of CASOS) {
    const real = reales.has(caso.email);
    const bien = real === caso.esperado;
    if (!bien) fallos++;
    console.log(
      `  ${String(caso.nombre).padEnd(10)} ${String(caso.vencimiento).padEnd(12)}` +
      `${caso.esperado ? 'SÍ       ' : 'no       '}   ${real ? 'SÍ      ' : 'no      '}    ` +
      `${bien ? 'ok' : 'FALLA'} (${caso.motivo})`
    );
  }

  console.log(`\nEntra en la corrida: ${obtenidas.length} de ${CASOS.length} casos` +
    ` (esperados: ${CASOS.filter((c) => c.esperado).length})`);

  const primero = obtenidas[0];
  if (primero) {
    const correo = generarMensaje(primero);
    console.log('\nMensaje que se enviaría a', correo.destinatario, '\n');
    console.log('  Asunto:', correo.asunto);
    console.log('  ' + correo.mensaje.replace(/\n/g, '\n  '));
  } else {
    console.log('\nNo se enviaría ningún mensaje.');
  }

  console.log(fallos === 0 ? '\nCALCULO OK' : `\n${fallos} CASOS MAL CALCULADOS`);
  return fallos === 0;
}

(async () => {
  await sequelize.sync();
  await vaciar();
  const sembrados = await sembrar();

  console.log('Base vaciada. Quedan los administradores:');
  for (const admin of await Administrador.findAll({ include: Persona })) {
    console.log(`  ${admin.nombreUsuario} (${admin.rol}) - ${admin.Persona.nombre} ${admin.Persona.apellido}`);
  }

  console.log(`\nEscenario sembrado: ${sembrados.length} socios / suscripciones, ` +
    `${await Notificacion.count()} notificaciones`);
  console.log('Vencimientos:');
  for (const caso of sembrados) {
    console.log(`  ${caso.nombre.padEnd(6)} ${String(caso.vencimiento).padEnd(12)}` +
      `socio ${String(caso.estadoSocio).padEnd(9)} suscripción ${caso.estadoSuscripcion}`);
  }

  const ok = await simular();
  await sequelize.close();
  process.exit(ok ? 0 : 1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
