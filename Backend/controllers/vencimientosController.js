const { Socio, Persona, Suscripcion } = require('../models');

const crearSuscripcion = async (req, res) => {
    try {
        const { socioId, fechaInicio, fechaVencimiento } = req.body;

        if (!socioId || !fechaInicio || !fechaVencimiento) {
            return res.status(400).json({ error: "Faltan datos obligatorios (socioId, fechaInicio, fechaVencimiento)." });
        }

        
        const socio = await Socio.findByPk(socioId);
        if (!socio) {
            return res.status(404).json({ error: "El socio indicado no existe." });
        }

        
        const nuevaSuscripcion = await Suscripcion.create({
            socioId, 
            fechaInicio,
            fechaVencimiento
        });

        return res.status(201).json({
            mensaje: "Suscripción creada exitosamente",
            suscripcion: nuevaSuscripcion
        });

    } catch (error) {
        console.error("Error al crear la suscripción:", error);
        return res.status(500).json({ error: "Error interno al guardar la suscripción." });
    }
};


const obtenerVencimientos = async (req, res) => {
    try {
        const suscripciones = await Suscripcion.findAll({
            include: [{
                model: Socio,
                include: [{ model: Persona}]
            }]
        });

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const limiteProximoVencer = new Date(hoy);
        limiteProximoVencer.setDate(hoy.getDate() + 5); //consideramos "próxima a vencer" si faltan 5 días o menos

        //mapeamos los resultados
        const vencimientos = suscripciones.map(suscripcion => {
            const fechaVen = new Date(suscripcion.fechaVencimiento + 'T00:00:00');
            let estadoCalculado = suscripcion.estado;

            if (estadoCalculado !== 'Cancelada') {
                if (fechaVen < hoy) {
                    estadoCalculado = 'Vencida';
                } else if (fechaVen >= hoy && fechaVen <= limiteProximoVencer) {
                    estadoCalculado = 'Próxima a vencer';
                } else {
                    estadoCalculado = 'Vigente';
                }
            }

            return {
                suscripcionId: suscripcion.suscripcionId,
                socio: suscripcion.Socio ? `${suscripcion.Socio.Persona.nombre} ${suscripcion.Socio.Persona.apellido}` : 'Socio Desconocido',
                contacto: suscripcion.Socio ? suscripcion.Socio.Persona.telefono : 'Sin teléfono',
                fechaInicio: suscripcion.fechaInicio,
                fechaVencimiento: suscripcion.fechaVencimiento,
                estado: estadoCalculado
            };
        });

        return res.status(200).json(vencimientos);

    } catch (error) {
        console.error("Error al obtener vencimientos:", error);
        return res.status(500).json({ error: "Error interno al procesar los vencimientos" });
    }
};

module.exports = { obtenerVencimientos, crearSuscripcion};