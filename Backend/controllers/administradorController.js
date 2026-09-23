const {Persona, Administrador, sequelize} = require('../models')
const bcrypt = require('bcryptjs');

const crearStaff = async (req, res) => {
    try {
        const {nombre,apellido,telefono,email,nombreUsuario,contrasena,rol} = req.body

        if (!nombre||!apellido||!email|| !nombreUsuario||!contrasena) {
            return res.status(400).json({error: "Faltan datos obligatorios."})}

        const personaExistente= await Persona.findOne({where:{email}})
        const usuarioExistente= await Administrador.findOne({where:{nombreUsuario }})

        if (personaExistente) {return res.status(400).json({error:"El email ya está registrado en el sistema."})}
        if (usuarioExistente) {return res.status(400).json({error:"El nombre de usuario ya está en uso."})}

        const contrasenaHash = await bcrypt.hash(contrasena, 12);

        const {nuevaPersona,nuevoStaff} = await sequelize.transaction(async (transaction) => {
                const nuevaPersona = await Persona.create({nombre,apellido,telefono,email},{transaction})
                const nuevoStaff = await Administrador.create({nombreUsuario,contrasena:contrasenaHash,rol:rol||'Profesor',administradorId:nuevaPersona.personaId},{transaction})
                return {nuevaPersona,nuevoStaff}})
        return res.status(201).json({
            mensaje:"Miembro del staff creado exitosamente",persona:nuevaPersona,
            staff: {administradorId:nuevoStaff.administradorId,nombreUsuario:nuevoStaff.nombreUsuario,rol: nuevoStaff.rol,estado: nuevoStaff.estado}});
    }catch (error) {
        console.error("Error al crear el staff:", error);
        return res.status(500).json({error: "Error interno del servidor al procesar el registro." });
    }
}
module.exports = {crearStaff};