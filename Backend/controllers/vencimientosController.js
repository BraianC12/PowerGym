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
        // Buscamos todas, pero ORDENADAS por fecha de vencimiento (la más nueva primero)
        const suscripciones = await Suscripcion.findAll({
            include: [{
                model: Socio,
                include: [{ model: Persona}]
            }],
            order: [['fechaVencimiento', 'DESC']] // <--- ESTO ES CLAVE
        });

        //Filtramos para quedarnos ÚNICAMENTE con la última de cada socio
        const suscripcionesUnicas = [];
        const sociosVistos = new Set();

        for (const suscripcion of suscripciones) {
            // Si todavía no vimos a este socio, guardamos esta suscripción (que es su más reciente)
            if (!sociosVistos.has(suscripcion.socioId)) {
                suscripcionesUnicas.push(suscripcion);
                sociosVistos.add(suscripcion.socioId); // Lo anotamos como ya visto
            }
        }

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const limiteProximoVencer = new Date(hoy);
        limiteProximoVencer.setDate(hoy.getDate() + 5);

        // Mapeamos PERO usamos el arreglo filtrado (suscripcionesUnicas)
        const vencimientos = suscripcionesUnicas.map(suscripcion => {
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
                socioId: suscripcion.socioId,
                socio: suscripcion.Socio ? `${suscripcion.Socio.Persona.nombre} ${suscripcion.Socio.Persona.apellido}` : 'Socio Desconocido',
                contacto: suscripcion.Socio ? suscripcion.Socio.Persona.telefono : 'Sin teléfono',
                fechaInicio: suscripcion.fechaInicio,
                fechaVencimiento: suscripcion.fechaVencimiento,
                estado: estadoCalculado,
                comentario: suscripcion.comentario || ''
            };
        });

        return res.status(200).json(vencimientos);

    } catch (error) {
        console.error("Error al obtener vencimientos:", error);
        return res.status(500).json({ error: "Error interno al procesar los vencimientos" });
    }
};

module.exports = { obtenerVencimientos, crearSuscripcion};