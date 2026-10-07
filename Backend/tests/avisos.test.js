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
  vencimiento = '2026-10-10',
  socioId = null
} = {}) {
  let socio = socioId ? await Socio.findByPk(socioId) : null;

  if (!socio) {
    const persona = await Persona.create({
      nombre: 'Ana',
      apellido: 'Perez',
      email
    });

    socio = await Socio.create({
      socioId: persona.personaId,
      estado: estadoSocio
    });
  }

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

  const persona = await Persona.findOne({ where: { email: 'ana@example.com' } });

  assert.equal(notificacion.suscripcionId, suscripcion.suscripcionId);
  assert.equal(
    notificacion.claveEnvio,
    `${persona.personaId}:2026-10-10`
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

test('solo envía un aviso por vencimiento, aunque sigan pasando los días', async () => {
  await crearSuscripcion();

  let cantidadEnvios = 0;
  const enviar = async () => {
    cantidadEnvios++;
    return { messageId: 'prueba-unavez' };
  };

  const primero = await procesarAvisos({ ahora: AHORA, enviar });
  const segundo = await procesarAvisos({
    ahora: new Date('2026-10-06T15:00:00Z'),
    enviar
  });
  const tercero = await procesarAvisos({
    ahora: new Date('2026-10-07T15:00:00Z'),
    enviar
  });

  assert.equal(cantidadEnvios, 1);
  assert.equal(await Notificacion.count(), 1);

  assert.deepEqual(primero, { enviados: 1, omitidos: 0, errores: 0 });
  assert.deepEqual(segundo, { enviados: 0, omitidos: 1, errores: 0 });
  assert.deepEqual(tercero, { enviados: 0, omitidos: 1, errores: 0 });
});

test('no reenvía si esa suscripción ya tiene un aviso con clave antigua', async () => {
  const suscripcion = await crearSuscripcion();

  // Formato anterior de la clave (persona:fechaDeEnvío).
  await Notificacion.create({
    suscripcionId: suscripcion.suscripcionId,
    claveEnvio: `${suscripcion.socioId}:2026-10-06`,
    mensaje: 'Aviso viejo',
    fechaProgramada: '2026-10-06',
    fechaEnvio: '2026-10-06',
    estado: 'Enviado'
  });

  const resumen = await procesarAvisos({
    ahora: AHORA,
    enviar: async () => {
      assert.fail('No debería reenviar un aviso ya enviado.');
    }
  });

  assert.deepEqual(resumen, { enviados: 0, omitidos: 1, errores: 0 });
  assert.equal(await Notificacion.count(), 1);
});

test('un vencimiento nuevo se avisa una sola vez, sin repetir el anterior', async () => {
  await crearSuscripcion({ email: 'renovada@x.com', vencimiento: '2026-10-07' });

  const persona = await Persona.findOne({ where: { email: 'renovada@x.com' } });
  const correos = [];
  const enviar = async (correo) => {
    correos.push(correo);
    return { messageId: 'nuevo-vencimiento' };
  };

  // Primer aviso: por el vencimiento del 07/10.
  const primero = await procesarAvisos({ ahora: AHORA, enviar });
  assert.deepEqual(primero, { enviados: 1, omitidos: 0, errores: 0 });

  // Aparece una suscripción nueva con vencimiento posterior.
  await crearSuscripcion({
    email: 'renovada@x.com',
    vencimiento: '2026-10-12',
    socioId: persona.personaId
  });

  // 08/10: el vencimiento anterior ya salió de la ventana y entra el nuevo.
  const segundo = await procesarAvisos({
    ahora: new Date('2026-10-08T15:00:00Z'),
    enviar
  });

  assert.deepEqual(segundo, { enviados: 1, omitidos: 0, errores: 0 });
  assert.equal(correos.length, 2);
  assert.match(correos[1].mensaje, /12\/10\/2026/);

  // 09/10 y 10/10: el vencimiento nuevo ya quedó avisado.
  const tercero = await procesarAvisos({
    ahora: new Date('2026-10-09T15:00:00Z'),
    enviar
  });
  const cuarto = await procesarAvisos({
    ahora: new Date('2026-10-10T15:00:00Z'),
    enviar
  });

  assert.equal(correos.length, 2);
  assert.equal(await Notificacion.count(), 2);
  assert.deepEqual(tercero, { enviados: 0, omitidos: 1, errores: 0 });
  assert.deepEqual(cuarto, { enviados: 0, omitidos: 1, errores: 0 });
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

test('avisa los vencimientos de toda la ventana, no solo el día exacto', async () => {
  await crearSuscripcion({ email: 'manana@x.com', vencimiento: '2026-10-07' });
  await crearSuscripcion({ email: 'exacto@x.com', vencimiento: '2026-10-10' });

  const correos = [];

  const resumen = await procesarAvisos({
    ahora: AHORA,
    enviar: async (correo) => {
      correos.push(correo);
      return { messageId: 'prueba-ventana' };
    }
  });

  assert.deepEqual(resumen, {
    enviados: 2,
    omitidos: 0,
    errores: 0
  });

  assert.deepEqual(
    correos.map((correo) => correo.destinatario).sort(),
    ['exacto@x.com', 'manana@x.com']
  );
});

test('no avisa suscripciones que ya vencieron', async () => {
  await crearSuscripcion({ email: 'vencida@x.com', vencimiento: '2026-10-04' });

  const resumen = await procesarAvisos({
    ahora: AHORA,
    enviar: async () => {
      assert.fail('No debería enviar avisos de vencimientos pasados.');
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

test('una persona con varias suscripciones en la ventana recibe un único correo', async () => {
  await crearSuscripcion({ email: 'doble@x.com', vencimiento: '2026-10-07' });

  const persona = await Persona.findOne({ where: { email: 'doble@x.com' } });

  await crearSuscripcion({
    email: 'doble@x.com',
    vencimiento: '2026-10-10',
    socioId: persona.personaId
  });

  const correos = [];

  const resumen = await procesarAvisos({
    ahora: AHORA,
    enviar: async (correo) => {
      correos.push(correo);
      return { messageId: 'prueba-dedupe' };
    }
  });

  assert.deepEqual(resumen, {
    enviados: 1,
    omitidos: 1,
    errores: 0
  });

  assert.equal(correos.length, 1);
  assert.match(correos[0].mensaje, /07\/10\/2026/);
  assert.equal(await Notificacion.count(), 1);
});