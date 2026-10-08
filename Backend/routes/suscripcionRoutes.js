const express = require('express');
const router = express.Router();
const { Suscripcion, Socio } = require('../models');
const { verificarToken } = require('../middlewares/authMiddleware');

router.post('/renovar/:socioId', verificarToken, async (req, res) => {
    const { socioId } = req.params;

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

        // Le sumamos 30 días a la fecha base calculada
        nuevaFechaVencimiento.setUTCDate(nuevaFechaVencimiento.getUTCDate() + 30);
        const vencimientoStr = nuevaFechaVencimiento.toISOString().slice(0, 10);

        //Creamos la nueva suscripción
        const nuevaSuscripcion = await Suscripcion.create({
            socioId,
            fechaInicio: nuevaFechaInicio,
            fechaVencimiento: vencimientoStr,
            estado: 'Vigente'
        });

        //Actualizamos el estado del socio a 'Activo'
        await Socio.update(
            { estado: 'Activo' },
            { where: { socioId } }
        );

        res.status(201).json({
            mensaje: 'Suscripción renovada con éxito por 30 días.',
            suscripcion: nuevaSuscripcion
        });

    } catch (error) {
        console.error('Error al renovar suscripción:', error);
        res.status(500).json({ error: 'Error interno del servidor.' });
    }
});

module.exports = router;