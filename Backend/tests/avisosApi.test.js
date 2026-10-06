process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'secreto-de-prueba';
process.env.AVISOS_TIMEZONE = 'America/Buenos_Aires';

const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const request = require('supertest');

const app = require('../app');
const { sequelize, Persona, Socio, Suscripcion, Notificacion } = require('../models');
const { fechaEnZona, calcularFechaObjetivo } = require('../services/avisosService');

const HOY = fechaEnZona(new Date(), 'America/Buenos_Aires');
const URL = '/api/avisos';

const token = (rol) => jwt.sign({ id: 1, rol }, process.env.JWT_SECRET, { expiresIn: '1h' });

beforeEach(async () => {
  assert.equal(sequelize.options.storage, ':memory:');
  await sequelize.sync({ force: true });
});

after(async () => { await sequelize.close(); });

async function crearNotificacion({ estado, fechaEnvio = null, email }) {
  const persona = await Persona.create({ nombre: 'Ana', apellido: 'Perez', email });
  const socio = await Socio.create({ socioId: persona.personaId, estado: 'Activo' });
  const suscripcion = await Suscripcion.create({
    socioId: socio.socioId,
    fechaInicio: '2026-09-10',
    fechaVencimiento: '2026-10-10',
    estado: 'Vigente'
  });
  return Notificacion.create({
    suscripcionId: suscripcion.suscripcionId,
    claveEnvio: `${persona.personaId}:${HOY}`,
    mensaje: 'Hola Ana',
    fechaProgramada: HOY,
    fechaEnvio,
    estado
  });
}

async function cargarBase() {
  await crearNotificacion({ estado: 'Enviado', fechaEnvio: HOY, email: 'hoy@x.com' });
  await crearNotificacion({ estado: 'Enviado', fechaEnvio: '2026-10-03', email: 'viejo@x.com' });
  await crearNotificacion({ estado: 'Error', email: 'error@x.com' });
}

async function crearSuscripcion({
  email,
  fechaVencimiento,
  estado = 'Vigente',
  estadoSocio = 'Activo',
  socioId = null
} = {}) {
  let socio = socioId ? await Socio.findByPk(socioId) : null;

  if (!socio) {
    const persona = await Persona.create({ nombre: 'Ana', apellido: 'Perez', email });
    socio = await Socio.create({ socioId: persona.personaId, estado: estadoSocio });
  }

  return Suscripcion.create({
    socioId: socio.socioId,
    fechaInicio: '2026-09-10',
    fechaVencimiento,
    estado
  });
}

test('devuelve historial con resumen y shape completo', async () => {
  await cargarBase();

  const r = await request(app).get(URL);

  assert.equal(r.status, 200);
  assert.deepEqual(r.body.resumen, { total: 3, enviados: 2, hoy: 1 });
  assert.equal(r.body.notificaciones.length, 3);
  assert.ok(r.body.notificaciones[0].notificacionId > r.body.notificaciones[1].notificacionId);
  assert.equal(r.body.notificaciones[0].socio, 'Ana Perez');
  assert.equal(r.body.notificaciones[0].fechaVencimiento, '2026-10-10');
});

test('filtra por estado sin mover el resumen global', async () => {
  await cargarBase();

  const enviados = await request(app).get(`${URL}?estado=Enviado`);
  const errores = await request(app).get(`${URL}?estado=Error`);

  assert.equal(enviados.status, 200);
  assert.equal(enviados.body.notificaciones.length, 2);
  assert.ok(enviados.body.notificaciones.every((n) => n.estado === 'Enviado'));
  assert.deepEqual(enviados.body.resumen, { total: 3, enviados: 2, hoy: 1 });

  assert.equal(errores.body.notificaciones.length, 1);
  assert.equal(errores.body.notificaciones[0].estado, 'Error');
});

test('acepta limite y respeta el máximo', async () => {
  await cargarBase();

  const uno = await request(app).get(`${URL}?limite=1`);
  assert.equal(uno.status, 200);
  assert.equal(uno.body.notificaciones.length, 1);

  const invalido = await request(app).get(`${URL}?limite=abc`);
  const cero = await request(app).get(`${URL}?limite=0`);
  const gigante = await request(app).get(`${URL}?limite=999`);

  assert.equal(invalido.status, 400);
  assert.equal(cero.status, 400);
  assert.equal(gigante.status, 400);
});

test('rechaza un estado desconocido', async () => {
  const r = await request(app).get(`${URL}?estado=Basura`);
  assert.equal(r.status, 400);
});

test('con la base vacía devuelve lista y resumen en ceros', async () => {
  const r = await request(app).get(URL);

  assert.equal(r.status, 200);
  assert.deepEqual(r.body.resumen, { total: 0, enviados: 0, hoy: 0 });
  assert.deepEqual(r.body.notificaciones, []);
});

test('un Profesor recibe 403', async () => {
  const r = await request(app)
    .get(URL)
    .set('Authorization', `Bearer ${token('Profesor')}`);

  assert.equal(r.status, 403);
});

test('un Dueño con token válido pasa', async () => {
  await cargarBase();

  const r = await request(app)
    .get(URL)
    .set('Authorization', `Bearer ${token('Dueño')}`);

  assert.equal(r.status, 200);
  assert.deepEqual(r.body.resumen, { total: 3, enviados: 2, hoy: 1 });
});

test('un token inválido recibe 401', async () => {
  const r = await request(app)
    .get(URL)
    .set('Authorization', 'Bearer basura');

  assert.equal(r.status, 401);
});

// ======================================================
// GET /api/avisos/pendientes
// ======================================================

test('devuelve los próximos avisos con la fecha objetivo', async () => {
  const fechaObjetivo = calcularFechaObjetivo();
  await crearSuscripcion({ email: 'proxima@x.com', fechaVencimiento: fechaObjetivo });

  const r = await request(app).get(`${URL}/pendientes`);

  assert.equal(r.status, 200);
  assert.equal(r.body.fechaObjetivo, fechaObjetivo);
  assert.equal(r.body.total, 1);
  assert.equal(r.body.pendientes.length, 1);

  const p = r.body.pendientes[0];
  assert.equal(p.socio, 'Ana Perez');
  assert.equal(p.email, 'proxima@x.com');
  assert.equal(p.fechaVencimiento, fechaObjetivo);
  assert.equal(p.asunto, 'PowerGym: aviso de vencimiento de tu cuota');
  assert.match(p.mensaje, /Hola Ana/);

  const [anio, mes, dia] = fechaObjetivo.split('-');
  assert.ok(p.mensaje.includes(`vence el ${dia}/${mes}/${anio}`));

  // Solo consulta: no escribe nada
  assert.equal(await Notificacion.count(), 0);
});

test('excluye las personas que ya recibieron su aviso hoy', async () => {
  const fechaObjetivo = calcularFechaObjetivo();
  await crearSuscripcion({ email: 'ya@x.com', fechaVencimiento: fechaObjetivo });

  const persona = await Persona.findOne({ where: { email: 'ya@x.com' } });

  await Notificacion.create({
    suscripcionId: (await Suscripcion.findOne()).suscripcionId,
    claveEnvio: `${persona.personaId}:${HOY}`,
    mensaje: 'Hola Ana',
    fechaProgramada: HOY,
    fechaEnvio: HOY,
    estado: 'Enviado'
  });

  const r = await request(app).get(`${URL}/pendientes`);

  assert.equal(r.status, 200);
  assert.equal(r.body.total, 0);
  assert.deepEqual(r.body.pendientes, []);
});

test('ignora otras fechas, socios inactivos y suscripciones canceladas', async () => {
  const fechaObjetivo = calcularFechaObjetivo();

  await crearSuscripcion({ email: 'otrafecha@x.com', fechaVencimiento: '2026-12-31' });
  await crearSuscripcion({ email: 'inactivo@x.com', fechaVencimiento: fechaObjetivo, estadoSocio: 'Inactivo' });
  await crearSuscripcion({ email: 'cancelada@x.com', fechaVencimiento: fechaObjetivo, estado: 'Cancelada' });

  const r = await request(app).get(`${URL}/pendientes`);

  assert.equal(r.status, 200);
  assert.equal(r.body.fechaObjetivo, fechaObjetivo);
  assert.equal(r.body.total, 0);
  assert.deepEqual(r.body.pendientes, []);
});

test('devuelve la ventana de aviso e incluye vencimientos dentro de ella', async () => {
  const desde = fechaEnZona(new Date(), 'America/Buenos_Aires');
  const manana = fechaEnZona(new Date(Date.now() + 86400000), 'America/Buenos_Aires');

  await crearSuscripcion({ email: 'manana@x.com', fechaVencimiento: manana });
  await crearSuscripcion({ email: 'hoy@ventana.com', fechaVencimiento: desde });
  await crearSuscripcion({ email: 'lejos@x.com', fechaVencimiento: '2026-12-31' });

  const r = await request(app).get(`${URL}/pendientes`);

  assert.equal(r.status, 200);
  assert.equal(r.body.desde, desde);
  assert.equal(r.body.hasta, calcularFechaObjetivo());
  assert.equal(r.body.fechaObjetivo, r.body.hasta);
  assert.equal(r.body.total, 2);
  assert.deepEqual(
    r.body.pendientes.map((p) => p.email).sort(),
    ['hoy@ventana.com', 'manana@x.com']
  );

  assert.equal(await Notificacion.count(), 0);
});

test('los próximos avisos también piden rol Dueño', async () => {
  // Sin header en test entra el bypass (rol Dueño); el 401 sin token
  // se verifica contra el servidor corriendo en development.
  const profesor = await request(app)
    .get(`${URL}/pendientes`)
    .set('Authorization', `Bearer ${token('Profesor')}`);

  assert.equal(profesor.status, 403);
});

test('una persona con varias suscripciones aparece una sola vez (la más urgente)', async () => {
  const manana = fechaEnZona(new Date(Date.now() + 86400000), 'America/Buenos_Aires');
  const desde = fechaEnZona(new Date(), 'America/Buenos_Aires');

  await crearSuscripcion({ email: 'doble@x.com', fechaVencimiento: manana });

  const persona = await Persona.findOne({ where: { email: 'doble@x.com' } });

  await crearSuscripcion({
    email: 'doble@x.com',
    fechaVencimiento: desde,
    socioId: persona.personaId
  });

  const r = await request(app).get(`${URL}/pendientes`);

  assert.equal(r.status, 200);
  assert.equal(r.body.total, 1);
  assert.equal(r.body.pendientes.length, 1);
  assert.equal(r.body.pendientes[0].email, 'doble@x.com');
  assert.equal(r.body.pendientes[0].fechaVencimiento, desde);
});

test('pendientes en ceros aunque la persona tenga otra suscripción sin avisar hoy', async () => {
  const fechaObjetivo = calcularFechaObjetivo();
  const hoy = fechaEnZona(new Date(), 'America/Buenos_Aires');

  await crearSuscripcion({ email: 'mixta@x.com', fechaVencimiento: fechaObjetivo });

  const persona = await Persona.findOne({ where: { email: 'mixta@x.com' } });

  await crearSuscripcion({
    email: 'mixta@x.com',
    fechaVencimiento: hoy,
    socioId: persona.personaId
  });

  await Notificacion.create({
    suscripcionId: (await Suscripcion.findAll())[0].suscripcionId,
    claveEnvio: `${persona.personaId}:${HOY}`,
    mensaje: 'Hola Ana',
    fechaProgramada: HOY,
    fechaEnvio: HOY,
    estado: 'Enviado'
  });

  const r = await request(app).get(`${URL}/pendientes`);

  assert.equal(r.status, 200);
  assert.equal(r.body.total, 0);
  assert.deepEqual(r.body.pendientes, []);
});