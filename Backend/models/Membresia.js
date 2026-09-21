const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/database');

class Membresia extends Model {}

Membresia.init({
  membresiaId: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING, allowNull: false },
  descripcion: { type: DataTypes.STRING },
  precio: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  duracionDias: { type: DataTypes.INTEGER, allowNull: false },
  activa: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { sequelize, modelName: 'Membresia', timestamps: false });

module.exports = Membresia;