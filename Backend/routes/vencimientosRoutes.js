const express = require('express');
const router = express.Router();
const { obtenerVencimientos, crearSuscripcion } = require('../controllers/vencimientosController');

router.post('/', crearSuscripcion);
router.get('/vencimientos', obtenerVencimientos);

module.exports = router;