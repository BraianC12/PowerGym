const { Persona, Administrador } = require('../models'); // Asegúrate de que apunte a tu archivo index.js de modelos

const crearStaff = async (req, res) => {
    try {
        const { nombre, apellido, telefono, email, nombreUsuario, contrasena, rol } = req.body;

        if (!nombre || !email || !nombreUsuario || !contrasena) {
            return res.status(400).json({ error: "Faltan datos obligatorios." });
        }

        const personaExistente = await Persona.findOne({ where: { email } });
        const usuarioExistente = await Administrador.findOne({ where: { nombreUsuario } });

        if (personaExistente) {
            return res.status(400).json({ error: "El email ya está registrado en el sistema." });
        }
        if (usuarioExistente) {
            return res.status(400).json({ error: "El nombre de usuario ya está en uso." });
        }

        const nuevaPersona = await Persona.create({
            nombre,
            apellido,
            telefono,
            email
        });

        const nuevoStaff = await Administrador.create({
            nombreUsuario,
            contrasena,
            rol: rol || 'Profesor', //Si el Dueño no especifica el rol, se asigna Profesor por seguridad
            personaId: nuevaPersona.id 
        });

        return res.status(201).json({
            mensaje: "Miembro del staff creado exitosamente",
            persona: nuevaPersona,
            staff: nuevoStaff
        });

    } catch (error) {
        console.error("Error al crear el staff:", error);
        return res.status(500).json({ error: "Error interno del servidor al procesar el registro." });
    }
};

module.exports = {
    crearStaff
};