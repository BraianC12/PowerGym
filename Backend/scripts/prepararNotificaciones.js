require('dotenv').config()
const {DataTypes} = require('sequelize')
const {sequelize, Notificacion} = require('../models')

async function prepararNotificaciones() {
  try {
    await sequelize.sync()
    const queryInterface = sequelize.getQueryInterface()
    const tabla = Notificacion.getTableName()
    const columnas = await queryInterface.describeTable(tabla)
    if (!columnas.claveEnvio) {
      await queryInterface.addColumn(tabla,'claveEnvio', {type: DataTypes.STRING,allowNull: true})
    }

    const indices = await queryInterface.showIndex(tabla)
    const tieneIndiceUnico = indices.some((indice)=>
      indice.unique&&indice.fields.length===1 && indice.fields[0].attribute==='claveEnvio'
    )

    if (!tieneIndiceUnico){
      await queryInterface.addIndex(tabla, ['claveEnvio'], {
        name: 'notificaciones_clave_envio_unica',unique:true})
    }
    console.log('Registro de notificaciones preparado.')

  } catch (error) {
    console.error('No se pudo preparar la tabla:', error.message)
    process.exitCode= 1
  } finally {await sequelize.close()}
}

prepararNotificaciones()