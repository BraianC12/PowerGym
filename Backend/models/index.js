const sequelize = require('../config/database');
const Persona = require('./Persona');
const Socio = require('./Socio');
const Administrador = require('./Administrador');
const Membresia = require('./Membresia');
const Suscripcion = require('./Suscripcion');
const Notificacion = require('./Notificacion');

// HERENCIA UML (1 a 1)
// Socio hereda de Persona
Persona.hasOne(Socio, { foreignKey: 'socioId', sourceKey: 'personaId', onDelete: 'CASCADE' });
Socio.belongsTo(Persona, { foreignKey: 'socioId', targetKey: 'personaId' });

//Administrador hereda de Persona
Persona.hasOne(Administrador, { foreignKey: 'administradorId', sourceKey: 'personaId', onDelete: 'CASCADE' });
Administrador.belongsTo(Persona, { foreignKey: 'administradorId', targetKey: 'personaId' });

// Un Socio posee muchas Suscripciones
Socio.hasMany(Suscripcion, { foreignKey: 'socioId' });
Suscripcion.belongsTo(Socio, { foreignKey: 'socioId' });

// Una Membresia (Plan) corresponde a muchas Suscripciones
Membresia.hasMany(Suscripcion, { foreignKey: 'membresiaId' });
Suscripcion.belongsTo(Membresia, { foreignKey: 'membresiaId' });

// Una Suscripcion genera muchas Notificaciones (avisos)
Suscripcion.hasMany(Notificacion, { foreignKey: 'suscripcionId' });
Notificacion.belongsTo(Suscripcion, { foreignKey: 'suscripcionId' });

// Exportamos todo listo para usar
module.exports = {
  sequelize,
  Persona,
  Socio,
  Administrador,
  Membresia,
  Suscripcion,
  Notificacion
};