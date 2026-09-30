// Debe establecerse antes de importar app y los modelos.
process.env.NODE_ENV = 'test';

const { test, beforeEach, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../app');
const { sequelize, Persona, Socio } = require('../models');

let socioId;

// Cada prueba comienza con datos nuevos en una base en memoria.
beforeEach(async () => {
  assert.equal(sequelize.options.storage, ':memory:');

  await sequelize.sync({ force: true });

  const persona = await Persona.create({
    nombre: 'Ana',
    apellido: 'Perez',
    telefono: '1112345678',
    email: 'ana@example.com'
  });

  const socio = await Socio.create({
    socioId: persona.personaId
  });

  socioId = socio.socioId;

  await Persona.create({
    nombre: 'Luis',
    apellido: 'Gomez',
    email: 'luis@example.com'
  });
});

after(async () => {
  await sequelize.close();
});

test('edita el nombre y conserva los campos no enviados', async () => {
  const respuesta = await request(app)
    .put(`/api/socios/${socioId}`)
    .send({ nombre: '  Andrea  ' });

  assert.equal(respuesta.status, 200);

  const persona = await Persona.findByPk(socioId);

  assert.equal(persona.nombre, 'Andrea');
  assert.equal(persona.apellido, 'Perez');
  assert.equal(persona.email, 'ana@example.com');
  assert.equal(persona.telefono, '1112345678');
});

test('permite borrar el teléfono', async () => {
  const respuesta = await request(app)
    .put(`/api/socios/${socioId}`)
    .send({ telefono: '' });

  assert.equal(respuesta.status, 200);

  const persona = await Persona.findByPk(socioId);
  assert.equal(persona.telefono, '');
});

test('permite cambiar el email por uno disponible', async () => {
  const respuesta = await request(app)
    .put(`/api/socios/${socioId}`)
    .send({ email: 'nuevo@example.com' });

  assert.equal(respuesta.status, 200);

  const persona = await Persona.findByPk(socioId);
  assert.equal(persona.email, 'nuevo@example.com');
});

test('permite conservar el email del propio socio', async () => {
  const respuesta = await request(app)
    .put(`/api/socios/${socioId}`)
    .send({ email: 'ana@example.com' });

  assert.equal(respuesta.status, 200);
});

const casosInvalidos = [
  ['email inválido', { email: 'correo-invalido' }],
  ['email duplicado', { email: 'luis@example.com' }],
  ['nombre vacío', { nombre: '   ' }],
  ['apellido vacío', { apellido: '' }],
  ['email vacío', { email: '' }],
  ['teléfono numérico', { telefono: 12345 }],
  ['nombre nulo', { nombre: null }],
  ['campo no permitido', { estado: 'Inactivo' }],
  ['cuerpo vacío', {}],
  ['cuerpo que es un arreglo', []],
  [
    'nombre válido acompañado de email inválido',
    { nombre: 'Otro nombre', email: 'incorrecto' }
  ]
];

for (const [descripcion, datos] of casosInvalidos) {
  test(`rechaza ${descripcion} sin modificar los datos`, async () => {
    const personaAntes = await Persona.findByPk(socioId);
    const socioAntes = await Socio.findByPk(socioId);

    const respuesta = await request(app)
      .put(`/api/socios/${socioId}`)
      .send(datos);

    assert.equal(respuesta.status, 400);

    const personaDespues = await Persona.findByPk(socioId);
    const socioDespues = await Socio.findByPk(socioId);

    assert.deepEqual(
      personaDespues.toJSON(),
      personaAntes.toJSON()
    );

    assert.deepEqual(
      socioDespues.toJSON(),
      socioAntes.toJSON()
    );
  });
}

test('rechaza una solicitud sin cuerpo', async () => {
  const respuesta = await request(app)
    .put(`/api/socios/${socioId}`);

  assert.equal(respuesta.status, 400);
});

test('devuelve 404 cuando el socio no existe', async () => {
  const respuesta = await request(app)
    .put('/api/socios/999999')
    .send({ nombre: 'Prueba' });

  assert.equal(respuesta.status, 404);
});

for (const id of ['abc', '0', '-1', '1.5']) {
  test(`rechaza el ID inválido ${id}`, async () => {
    const respuesta = await request(app)
      .put(`/api/socios/${id}`)
      .send({ nombre: 'Prueba' });

    assert.equal(respuesta.status, 400);
  });
}