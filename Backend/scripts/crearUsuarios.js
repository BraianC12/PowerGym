// ==========================================================
// SCRIPT / CREAR USUARIOS (Dueño / Profesor)
// Uso:
//   node scripts/crearUsuarios.js <email> <nombre> <apellido> <usuario> <rol> [password]
//
// Ejemplos:
//   node scripts/crearUsuarios.js dueno@powergym.com Carlos Gómez admin_dueno Dueño clave123
//   node scripts/crearUsuarios.js laura@powergym.com Laura Martínez profe_laura Profesor clave123
//
// Si la Persona con ese email ya existe, la reutiliza y solo
// crea/actualiza el Administrador. No duplica emails.
// ==========================================================

const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const { Persona, Administrador } = require('../models');

const [email, nombre, apellido, usuario, rol, password] = process.argv.slice(2);

const ROLES = ['Dueño', 'Profesor'];

(async () => {
  try {
    if (!email || !nombre || !apellido || !usuario || !rol) {
      console.error('Faltan datos. Uso: node scripts/crearUsuarios.js <email> <nombre> <apellido> <usuario> <rol> [password]');
      process.exit(1);
    }

    if (!ROLES.includes(rol)) {
      console.error(`El rol debe ser uno de: ${ROLES.join(', ')}`);
      process.exit(1);
    }

    await sequelize.sync();

    const contrasena = password || 'clave123';
    const contrasenaHash = await bcrypt.hash(contrasena, 12);

    let persona = await Persona.findOne({ where: { email } });
    if (persona) {
      persona.nombre = nombre;
      persona.apellido = apellido;
      await persona.save();
      console.log(`Persona existente reutilizada (id ${persona.personaId}).`);
    } else {
      persona = await Persona.create({ nombre, apellido, email });
      console.log(`Persona creada (id ${persona.personaId}).`);
    }

    const admin = await Administrador.findOne({
      where: { administradorId: persona.personaId },
    });

    if (admin) {
      admin.nombreUsuario = usuario;
      admin.contrasena = contrasenaHash;
      admin.rol = rol;
      await admin.save();
      console.log(`Administrador "${usuario}" actualizado.`);
    } else {
      await Administrador.create({
        administradorId: persona.personaId,
        nombreUsuario: usuario,
        contrasena: contrasenaHash,
        rol,
      });
      console.log(`Administrador "${usuario}" creado.`);
    }

    console.log(`Listo -> email: ${email} | usuario: ${usuario} | rol: ${rol} | contrasena: ${contrasena}`);
    process.exit(0);
  } catch (error) {
    console.error('Error al crear el usuario:', error);
    process.exit(1);
  }
})();