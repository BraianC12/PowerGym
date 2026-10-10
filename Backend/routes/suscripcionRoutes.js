const express = require('express');
const router = express.Router();
const { Suscripcion, Socio } = require('../models');
const { verificarToken } = require('../middlewares/authMiddleware');

router.post('/renovar/:socioId', verificarToken, async (req, res) => {
    const { socioId } = req.params;
    const { fechaVencimiento, comentario } = req.body || {};

    try {
        //Buscamos la última suscripción del socio para ver cuándo se le vencía
        const ultimaSuscripcion = await Suscripcion.findOne({
            where: { socioId },
            order: [['fechaVencimiento', 'DESC']]
        });

        if (!ultimaSuscripcion) {
            return res.status(404).json({ error: 'El socio no tiene suscripciones previas.' });
        }

        const hoy = new Date();
        // Normalizamos la fecha de hoy a YYYY-MM-DD para comparar bien
        const fechaHoyStr = hoy.toISOString().slice(0, 10); 
        const vencimientoAnterior = ultimaSuscripcion.fechaVencimiento;

        let nuevaFechaInicio;
        let nuevaFechaVencimiento = new Date();

        if (vencimientoAnterior < fechaHoyStr) {
            // Caso A: Ya estaba vencido. Los 30 días corren desde HOY.
            nuevaFechaInicio = fechaHoyStr;
            nuevaFechaVencimiento = new Date(hoy);
        } else {
            // Caso B: Paga adelantado o el mismo día. Le sumamos a su vencimiento original.
            nuevaFechaInicio = vencimientoAnterior;
            nuevaFechaVencimiento = new Date(`${vencimientoAnterior}T12:00:00Z`);
        }

        let vencimientoStr;
        if (fechaVencimiento) {
            // Si el administrador eligió una fecha, la usamos en lugar de la automática.
            if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaVencimiento)) {
                return res.status(400).json({ error: 'La fecha de vencimiento debe tener formato YYYY-MM-DD.' });
            }
            if (fechaVencimiento < nuevaFechaInicio) {
                return res.status(400).json({ error: 'La fecha de vencimiento no puede ser anterior a la fecha de inicio.' });
            }
            vencimientoStr = fechaVencimiento;
        } else {
            // Le sumamos 30 días a la fecha base calculada
            nuevaFechaVencimiento.setUTCDate(nuevaFechaVencimiento.getUTCDate() + 30);
            vencimientoStr = nuevaFechaVencimiento.toISOString().slice(0, 10);
        }

        //Creamos la nueva suscripción
        const nuevaSuscripcion = await Suscripcion.create({
            socioId,
            fechaInicio: nuevaFechaInicio,
            fechaVencimiento: vencimientoStr,
            estado: 'Vigente',
            comentario: comentario ? String(comentario).trim() : null
        });

        //La anterior deja de estar vigente: queda marcada como renovada,
        //así los avisos automáticos no vuelven a avisarla.
        await ultimaSuscripcion.update({ estado: 'Renovada' });

        //Actualizamos el estado del socio a 'Activo'
        await Socio.update(
            { estado: 'Activo' },
            { where: { socioId } }
        );

        res.status(201).json({
            mensaje: fechaVencimiento
                ? 'Suscripción renovada con éxito.'
                : 'Suscripción renovada con éxito por 30 días.',
            suscripcion: nuevaSuscripcion
        });

    } catch (error) {
        console.error('Error al renovar suscripción:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

module.exports = router;