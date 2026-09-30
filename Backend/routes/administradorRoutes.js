const express = require('express');
const router = express.Router();
const { crearStaff, obtenerEntrenadores,editarStaff, darDeBajaStaff} = require('../controllers/administradorController');

//Endpoint para que el Dueño registre un nuevo profesor
router.get('/', obtenerEntrenadores);
router.post('/', crearStaff);
router.put('/:id', editarStaff);
router.patch('/:id', darDeBajaStaff);

module.exports = router;