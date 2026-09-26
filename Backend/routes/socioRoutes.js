const express = require('express');
const router = express.Router();
const { crearSocio, darDeBajaSocio, obtenerSocios } = require('../controllers/socioController');
const { editarSocio } = require('../controllers/socioController')

router.post('/', crearSocio); 
router.get('/', obtenerSocios); 
router.patch('/:id', darDeBajaSocio);
router.put('/:id', editarSocio);
 


module.exports = router;