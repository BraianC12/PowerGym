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

const editarStaff = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, apellido, telefono, email, nombreUsuario, rol, contrasena } = req.body;

        //buscamos al Administrador
        const admin = await Administrador.findByPk(id, {
            include: [{ model: Persona }]
        });

        if (!admin) {
            return res.status(404).json({ error: "Miembro del staff no encontrado."});
        }

        //Validar que el nuevo email no pise el de otra Persona existente
        if (email && email !== admin.Persona.email) {
            const emailExistente = await Persona.findOne({ where: { email } });
            if (emailExistente) {
                return res.status(400).json({ error: "El correo electronico ya está en uso por otro usuario" });
            }
        }

        //validar que el nombreUsuario no esté en uso por otro Administrador
        if (nombreUsuario && nombreUsuario !== admin.nombreUsuario) {
            const usuarioExistente = await Administrador.findOne({ where: {nombreUsuario} });
            if (usuarioExistente) {
                return res.status(400).json({ error: "El nombre de usuario ya está en uso" });
            }
        }

        await admin.Persona.update({
            nombre: nombre || admin.Persona.nombre,
            apellido: apellido || admin.Persona.apellido,
            telefono: telefono || admin.Persona.telefono,
            email: email || admin.Persona.email
        });

        await admin.update({
            nombreUsuario: nombreUsuario || admin.nombreUsuario,
            rol: rol || admin.rol,
            contrasena: contrasena || admin.contrasena
        });

        return res.status(200).json({
            mensaje: "Datos del staff actualizados correctamente",
            staff: admin
        });

    } catch (error) {
        console.error("Error al actualizar el staff:", error);
        return res.status(500).json({ error: "Error interno al modificar los datos del staff." });
    }
};

const darDeBajaStaff = async (req, res) => {
    try {
        const { id } = req.params;

        //buscamos al administrador por su ID
        const admin = await Administrador.findByPk(id);

        if (!admin) {
            return res.status(404).json({ error: "Miembro del staff no encontrado." });
        }

        //si ya está inactivo, podemos avisarlo
        if (admin.estado === 'Inactivo') {
            return res.status(400).json({ mensaje: "El miembro del staff ya se encuentra inactivo." });
        }

        //cambiamos el estado y guardamos
        admin.estado = 'Inactivo';
        await admin.save();

        return res.status(200).json({
            mensaje: "Miembro del staff dado de baja correctamente",
            staff: admin
        });

    } catch (error) {
        console.error("Error al dar de baja al staff:", error);
        return res.status(500).json({ error: "Error interno al procesar la baja." });
    }
};

module.exports = {crearStaff, editarStaff, darDeBajaStaff};