const express = require('express');
const router = express.Router();
const { crearSocio, darDeBajaSocio, obtenerSocios } = require('../controllers/socioController');
const { crearStaff } = require('../controllers/administradorController');

router.post('/', crearSocio); 
router.get('/', obtenerSocios); 
router.patch('/:id', darDeBajaSocio); 
router.post('/', crearStaff);

module.exports = router;