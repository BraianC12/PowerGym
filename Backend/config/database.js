const { Sequelize } = require('sequelize');

//Conexión a SQLite 
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './powergym.sqlite', // Aquí se guardarán todos los datos
  logging: false
});

module.exports = sequelize;