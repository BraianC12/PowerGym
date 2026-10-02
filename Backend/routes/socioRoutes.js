const express = require('express');
const router = express.Router();
const { crearSocio, darDeBajaSocio, obtenerSocios, obtenerSocioPorId, editarSocio } = require('../controllers/socioController');
const { verificarToken } = require('../middlewares/authMiddleware');

router.post('/', verificarToken, crearSocio); 
router.get('/', verificarToken, obtenerSocios); 
router.get('/:id', verificarToken, obtenerSocioPorId);
router.patch('/:id', verificarToken, darDeBajaSocio); 
router.put('/:id', verificarToken, editarSocio);

module.exports = router;