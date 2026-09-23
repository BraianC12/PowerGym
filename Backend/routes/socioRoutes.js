const express = require('express');
const router = express.Router();
const { crearSocio, darDeBajaSocio, obtenerSocios } = require('../controllers/socioController');


router.post('/', crearSocio); 
router.get('/', obtenerSocios); 
router.patch('/:id', darDeBajaSocio); 


module.exports = router;