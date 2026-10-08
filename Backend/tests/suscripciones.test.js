process.env.NODE_ENV = 'test';

const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../app');
const { sequelize, Persona, Socio, Suscripcion } = require('../models');

let socioIdPrueba;

beforeEach(async () => {
  assert.equal(sequelize.options.storage, ':memory:');
  await sequelize.sync({ force: true });

  const persona = await Persona.create({ nombre: 'Juan', apellido: 'Perez', email: 'juan@example.com' });
  const socio = await Socio.create({ socioId: persona.personaId, estado: 'Inactivo' });
  socioIdPrueba = socio.socioId;
});

after(async () => {
  await sequelize.close();
});

test('renueva la suscripción de un socio vencido (Caso A) sumando 30 días desde hoy', async () => {
  // Le creamos una suscripción vieja que venció ayer
  const ayer = new Date();
  ayer.setDate(ayer.getDate() - 1);
  
  await Suscripcion.create({
      socioId: socioIdPrueba,
      fechaInicio: '2026-08-01',
      fechaVencimiento: ayer.toISOString().slice(0, 10),
      estado: 'Vencida'
  });

  // El front solo manda el POST al ID del socio
  const respuesta = await request(app)
    .post(`/api/suscripciones/renovar/${socioIdPrueba}`);

  assert.equal(respuesta.status, 201);
  assert.equal(respuesta.body.mensaje, 'Suscripción renovada con éxito por 30 días.');

  const socioDB = await Socio.findByPk(socioIdPrueba);
  assert.equal(socioDB.estado, 'Activo', 'El socio debe pasar a estado Activo');
  
  const nuevaSub = await Suscripcion.findOne({ where: { socioId: socioIdPrueba }, order: [['fechaVencimiento', 'DESC']] });
  assert.equal(nuevaSub.estado, 'Vigente');
});

test('renueva la suscripción de un socio activo (Caso B) sumando 30 días a su vencimiento original', async () => {
  // Le creamos una suscripción que vence en 5 días (paga por adelantado)
  const vencimientoFuturo = new Date();
  vencimientoFuturo.setDate(vencimientoFuturo.getDate() + 5);
  const vencimientoFuturoStr = vencimientoFuturo.toISOString().slice(0, 10);
  
  await Suscripcion.create({
      socioId: socioIdPrueba,
      fechaInicio: '2026-10-01',
      fechaVencimiento: vencimientoFuturoStr,
      estado: 'Vigente'
  });

  // El front manda el POST
  const respuesta = await request(app)
    .post(`/api/suscripciones/renovar/${socioIdPrueba}`);

  assert.equal(respuesta.status, 201);

  // Verificamos que los 30 días se sumaron a su fecha original, no a la de hoy
  const nuevaSub = await Suscripcion.findOne({ 
      where: { socioId: socioIdPrueba }, 
      order: [['fechaVencimiento', 'DESC']] 
  });
  
  const fechaEsperada = new Date(`${vencimientoFuturoStr}T12:00:00Z`);
  fechaEsperada.setUTCDate(fechaEsperada.getUTCDate() + 30);
  const fechaEsperadaStr = fechaEsperada.toISOString().slice(0, 10);

  assert.equal(nuevaSub.fechaVencimiento, fechaEsperadaStr, 'La fecha debe sumar 30 días al vencimiento original');
});