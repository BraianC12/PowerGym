const express = require('express');
const router = express.Router();
const { crearSocio, darDeBajaSocio, reactivarSocio, obtenerSocios, obtenerSocioPorId, editarSocio } = require('../controllers/socioController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.post('/', verificarToken, crearSocio); 
router.get('/', verificarToken, obtenerSocios); 
router.get('/:id', verificarToken, obtenerSocioPorId);
router.patch('/:id/reactivar', verificarToken, reactivarSocio);
router.patch('/:id', verificarToken, darDeBajaSocio); 
router.put('/:id', verificarToken, editarSocio);

module.exports = router;