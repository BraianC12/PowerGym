const express = require('express');
const router = express.Router();
const { crearStaff } = require('../controllers/administradorController');

//Endpoint para que el Dueño registre un nuevo profesor
router.post('/', crearStaff);

module.exports = router;