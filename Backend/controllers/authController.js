const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Administrador, Persona } = require('../models');

const login = async (req, res) => {
    const { email, contrasena } = req.body;

    //validar que vengan los datos
    if (!email || !contrasena) {
        return res.status(400).json({ message: 'El email y la contraseña son obligatorios' });
    }

    try {
        //buscar el administrador por email
        const administrador = await Administrador.findOne({ 
            include: [{ 
                model: Persona,
                where: { email }
            }],
        });

        if(!administrador) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        //comparar la contraseña en texto plano con el hash de la BD
        const passwordValida = await bcrypt.compare(contrasena, administrador.contrasena);

        if(!passwordValida) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        //JWT
        const token = jwt.sign(
            {
                id: administrador.administradorId,
                rol: administrador.rol
            },
            process.env.JWT_SECRET,
            {expiresIn: '1h'}
        );
        
        //si todo es correcto, devolver un mensaje de éxito
        res.status(200).json({ 
            message: 'Inicio de sesión exitoso',
            token: token,
            usuario: {
                id: administrador.administradorId,
                nombre: administrador.Persona.nombre,
                email: administrador.Personaemail,
                rol: administrador.rol
            }
        });
    } catch (error) {
        console.error('Erorr en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

module.exports = { login };