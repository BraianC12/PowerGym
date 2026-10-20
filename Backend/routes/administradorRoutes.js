const express = require('express');
const router = express.Router();
const { crearStaff, obtenerEntrenadores, editarStaff, darDeBajaStaff } = require('../controllers/administradorController');
const { verificarToken } = require('../middlewares/authMiddleware');
const { exigirRol } = require('../middlewares/rolesMiddleware');

// Endpoint para que el Dueño gestione el staff / profesores
router.get('/', verificarToken, exigirRol('Dueño'), obtenerEntrenadores);
router.post('/', verificarToken, exigirRol('Dueño'), crearStaff);
router.put('/:id', verificarToken, exigirRol('Dueño'), editarStaff);
router.patch('/:id', verificarToken, exigirRol('Dueño'), darDeBajaStaff);

module.exports = router;