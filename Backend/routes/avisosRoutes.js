const express = require('express');
const router = express.Router();
const { historial, pendientes } = require('../controllers/avisosController');
const { verificarToken } = require('../middlewares/authMiddleware');
const { exigirRol } = require('../middlewares/rolesMiddleware');

// GET /api/avisos/pendientes  -> próximos avisos por enviar (sin enviar nada)
router.get('/pendientes', verificarToken, exigirRol('Dueño'), pendientes);

// GET /api/avisos?estado=Enviado&limite=50
router.get('/', verificarToken, exigirRol('Dueño'), historial);

module.exports = router;