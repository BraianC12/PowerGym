const express = require('express');
const router = express.Router();
const { crearSocio, darDeBajaSocio, obtenerSocios, obtenerSocioPorId, editarSocio } = require('../controllers/socioController');

router.post('/', crearSocio); 
router.get('/', obtenerSocios); 
router.get('/:id',obtenerSocioPorId);
router.patch('/:id', darDeBajaSocio); 


module.exports = router;