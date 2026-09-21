const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Suscripcion extends Model {}

Suscripcion.init({
  suscripcionId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  fechaInicio: { type: DataTypes.DATEONLY, allowNull: false },
  fechaVencimiento: { type: DataTypes.DATEONLY, allowNull: false },
  estado: { type: DataTypes.STRING, defaultValue: 'Vigente' } // Puede ser Vigente, Vencida, Cancelada
}, { 
  sequelize, 
  modelName: 'Suscripcion', 
  timestamps: false 
});

module.exports = Suscripcion;