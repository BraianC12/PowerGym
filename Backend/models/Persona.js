const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// Definición de la Clase Persona heredando de Model
class Persona extends Model {}

Persona.init({
  personaId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING, allowNull: false },
  apellido: { type: DataTypes.STRING, allowNull: false },
  telefono: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING, unique: true }
}, { 
  sequelize, 
  modelName: 'Persona',
  timestamps: false 
});

module.exports = Persona;