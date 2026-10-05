process.env.NODE_ENV = 'test'

require('dotenv').config()
const assert = require('node:assert/strict')
const {sequelize,Persona,Socio,Suscripcion,Notificacion} = require('../models')
const {calcularFechaObjetivo,procesarAvisos}= require('../services/avisosService')

async function probarAvisoCompleto() {
  try {
    assert.equal(sequelize.options.storage, ':memory:')
    const destinatario = process.env.SMTP_USER

    if (!destinatario) {throw new Error('Falta SMTP_USER en el .env.')}
    await sequelize.sync({ force: true })
    
    const ahora= new Date();
    const vencimiento= calcularFechaObjetivo(ahora)
    const persona= await Persona.create({nombre: 'Socio de prueba',apellido: 'PowerGym',email: destinatario})
    const socio= await Socio.create({socioId: persona.personaId,estado: 'Activo'})

    await Suscripcion.create({socioId: socio.socioId,fechaInicio: '2026-01-01',fechaVencimiento: vencimiento,estado: 'Vigente'})
    const primera= await procesarAvisos({ ahora })

    console.log('Primera ejecución:', primera)
    assert.deepEqual(primera, {enviados: 1,omitidos: 0,errores: 0})

    const segunda= await procesarAvisos({ ahora })
    console.log('Segunda ejecución:', segunda)
    assert.deepEqual(segunda, {enviados: 0,omitidos: 1,errores: 0})

    const notificacion= await Notificacion.findOne()
    assert.equal(notificacion.estado, 'Enviado')
    assert.equal(await Notificacion.count(), 1)
    console.log('Prueba completa correcta: un envío y ningún duplicado.')

  }catch (error) {
    console.error('Falló la prueba:', error.message)
    process.exitCode = 1
  } finally {await sequelize.close()}
}

probarAvisoCompleto()