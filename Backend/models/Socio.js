const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Definición de la Clase Socio
class Socio extends Model {}

Socio.init({
  socioId: { type: DataTypes.INTEGER, primaryKey: true }, 
  fechaAlta: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
  fechaBaja: { type: DataTypes.DATEONLY, allowNull: true },
  estado: { type: DataTypes.STRING, defaultValue: 'Activo' }
}, { 
  sequelize, 
  modelName: 'Socio',
  timestamps: false 
});

module.exports = Socio;