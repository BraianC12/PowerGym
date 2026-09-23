const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Administrador extends Model {}

Administrador.init({
  administradorId: { type: DataTypes.INTEGER, primaryKey: true},
  nombreUsuario: { type: DataTypes.STRING, allowNull: false, unique: true },
  contrasena: { type: DataTypes.STRING, allowNull: false },
  rol: {type: DataTypes.ENUM('Dueño', 'Profesor'), defaultValue: 'Profesor'},
  estado: { type: DataTypes.STRING, defaultValue: 'Activo' }
}, { 
  sequelize, 
  modelName: 'Administrador', 
  timestamps: false 
});

module.exports = Administrador;