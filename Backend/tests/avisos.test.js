process.env.NODE_ENV = 'test';
process.env.AVISOS_DIAS_ANTES = '5';
process.env.AVISOS_TIMEZONE = 'America/Buenos_Aires';

const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');

const {
  sequelize,
  Persona,
  Socio,
  Suscripcion,
  Notificacion
} = require('../models');

const {
  calcularFechaObjetivo,
  procesarAvisos
} = require('../services/avisosService');

// Fecha fija: 5 de octubre al mediodía en Argentina.
const AHORA = new Date('2026-10-05T15:00:00Z');

beforeEach(async () => {
  assert.equal(sequelize.options.storage, ':memory:');

  await sequelize.sync({ force: true });

  process.env.AVISOS_DIAS_ANTES = '5';
});

after(async () => {
  await sequelize.close();
});

async function crearSuscripcion({
  email = 'ana@example.com',
  estadoSocio = 'Activo',
  estadoSuscripcion = 'Vigente',
  vencimiento = '2026-10-10'
} = {}) {
  const persona = await Persona.create({
    nombre: 'Ana',
    apellido: 'Perez',
    email
  });

  const socio = await Socio.create({
    socioId: persona.personaId,
    estado: estadoSocio
  });

  return Suscripcion.create({
    socioId: socio.socioId,
    fechaInicio: '2026-09-10',
    fechaVencimiento: vencimiento,
    estado: estadoSuscripcion
  });
}

test('calcula el vencimiento según los días configurados', () => {
  assert.equal(calcularFechaObjetivo(AHORA), '2026-10-10');

  process.env.AVISOS_DIAS_ANTES = '3';

  assert.equal(calcularFechaObjetivo(AHORA), '2026-10-08');
});

test('usa la fecha de Argentina aunque en UTC ya sea otro día', () => {
  const ahora = new Date('2026-10-06T01:00:00Z');

  assert.equal(calcularFechaObjetivo(ahora), '2026-10-10');
});

test('rechaza una cantidad de días inválida', () => {
  process.env.AVISOS_DIAS_ANTES = 'abc';

  assert.throws(
    () => calcularFechaObjetivo(AHORA),
    /entero positivo/
  );
});

test('envía el mensaje y registra la notificación', async () => {
  const suscripcion = await crearSuscripcion();
  const correos = [];

  const resumen = await procesarAvisos({
    ahora: AHORA,
    enviar: async (correo) => {
      correos.push(correo);
      return { messageId: 'prueba-1' };
    }
  });

  assert.deepEqual(resumen, {
    enviados: 1,
    omitidos: 0,
    errores: 0
  });

  assert.equal(correos.length, 1);
  assert.equal(correos[0].destinatario, 'ana@example.com');
  assert.match(correos[0].mensaje, /Hola Ana/);
  assert.match(correos[0].mensaje, /10\/10\/2026/);

  const notificacion = await Notificacion.findOne();

  assert.equal(notificacion.suscripcionId, suscripcion.suscripcionId);
  assert.equal(
    notificacion.claveEnvio,
    `${suscripcion.suscripcionId}:2026-10-10`
  );
  assert.equal(notificacion.estado, 'Enviado');
  assert.equal(notificacion.fechaEnvio, '2026-10-05');
});

test('una segunda ejecución no vuelve a enviar el aviso', async () => {
  await crearSuscripcion();

  let cantidadEnvios = 0;

  const opciones = {
    ahora: AHORA,
    enviar: async () => {
      cantidadEnvios++;
      return { messageId: 'prueba-2' };
    }
  };

  await procesarAvisos(opciones);
  const segundaEjecucion = await procesarAvisos(opciones);

  assert.equal(cantidadEnvios, 1);
  assert.equal(await Notificacion.count(), 1);

  assert.deepEqual(segundaEjecucion, {
    enviados: 0,
    omitidos: 1,
    errores: 0
  });
});

test('excluye otras fechas, socios inactivos y suscripciones canceladas', async () => {
  await crearSuscripcion({
    email: 'otrafecha@example.com',
    vencimiento: '2026-10-11'
  });

  await crearSuscripcion({
    email: 'inactivo@example.com',
    estadoSocio: 'Inactivo'
  });

  await crearSuscripcion({
    email: 'cancelada@example.com',
    estadoSuscripcion: 'Cancelada'
  });

  const resumen = await procesarAvisos({
    ahora: AHORA,
    enviar: async () => {
      assert.fail('No debería intentar enviar ningún correo.');
    }
  });

  assert.deepEqual(resumen, {
    enviados: 0,
    omitidos: 0,
    errores: 0
  });

  assert.equal(await Notificacion.count(), 0);
});

test('registra un error de envío y no lo reintenta automáticamente', async () => {
  await crearSuscripcion();

  let intentos = 0;

  const opciones = {
    ahora: AHORA,
    enviar: async () => {
      intentos++;
      throw new Error('Fallo SMTP simulado');
    }
  };

  const primeraEjecucion = await procesarAvisos(opciones);

  assert.deepEqual(primeraEjecucion, {
    enviados: 0,
    omitidos: 0,
    errores: 1
  });

  const notificacion = await Notificacion.findOne();

  assert.equal(notificacion.estado, 'Error');
  assert.equal(notificacion.fechaEnvio, null);

  const segundaEjecucion = await procesarAvisos(opciones);

  assert.equal(intentos, 1);
  assert.equal(segundaEjecucion.omitidos, 1);
});