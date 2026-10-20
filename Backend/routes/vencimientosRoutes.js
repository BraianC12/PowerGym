const express = require('express');
const router = express.Router();
const { obtenerVencimientos, crearSuscripcion } = require('../controllers/vencimientosController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.post('/', verificarToken, crearSuscripcion);
router.get('/vencimientos', verificarToken, obtenerVencimientos);

module.exports = router;