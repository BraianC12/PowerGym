const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Notificacion extends Model {}

Notificacion.init({
  notificacionId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  mensaje: { type: DataTypes.TEXT, allowNull: false },
  fechaProgramada: { type: DataTypes.DATEONLY, allowNull: false },
  fechaEnvio: { type: DataTypes.DATEONLY, allowNull: true },
  estado: { type: DataTypes.STRING, defaultValue: 'Pendiente' } // Pendiente, Enviado, Error
}, { 
  sequelize, 
  modelName: 'Notificacion', 
  timestamps: false 
});

module.exports = Notificacion;