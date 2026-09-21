const { Persona, Socio } = require('../models');

const crearSocio = async (req, res) => {
  try {
    const { nombre, apellido, telefono, email } = req.body;

    if(!nombre || !apellido || !email) {
      return res.status(400).json({
        error: 'datos incompletos. El nombre, apellido y email son obligatorios'
      });
    }

    //validar el formato del Email
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!regexEmail.test(email)){
      return res.status(400).json({
        error: 'El formato del correo electrónico no es valido'
      });
    }

    //valor duplicados: no permite registrar un socio si ya existe
    const personaExistente = await Persona.findOne({where: {email}});

    if (personaExistente) {
      return res.status(400).json({
        error: 'Ya existe un socio registrado con este correo electronico'
      });
    }

    
    const nuevaPersona = await Persona.create({ nombre, apellido, telefono, email });
    
    //Instanciamos y guardamos el objeto Hijo (Socio) vinculándolo al Padre
    const nuevoSocio = await Socio.create({ socioId: nuevaPersona.personaId });

    res.status(201).json({ 
      mensaje: 'Socio creado exitosamente', 
      socio: {
        id: nuevoSocio.socioId,
        nombre: nuevaPersona.nombre,
        apellido: nuevaPersona.apellido,
        email: nuevaPersona.email,
        estado: nuevoSocio.estado,
        fechaAlta: nuevoSocio.fechaAlta
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar', detalle: error.message });
  }
};

//endpoint PATCH: dar de baja socio
const darDeBajaSocio = async (req, res) => {
  try {
    // Buscamos la instancia del objeto
    const socio = await Socio.findByPk(req.params.id);
    if (!socio) return res.status(404).json({ error: 'Socio no encontrado' });

    // Modificamos las propiedades del objeto y guardamos
    socio.estado = 'Inactivo';
    socio.fechaBaja = new Date();
    await socio.save();

    res.json({ mensaje: 'Socio dado de baja correctamente', socio });
  } catch (error) {
    res.status(500).json({ error: 'Error al procesar la baja', detalle: error.message });
  }
};


//EndPoint GET: consultar información de lo socios
const obtenerSocios = async (req, res) => {
  try {
    const socios = await Socio.findAll({
      where: { estado: 'Activo' },
      include: [{ model: Persona }] // Trae los datos heredados
    });
    res.json(socios);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la lista', detalle: error.message });
  }
};

module.exports = { crearSocio, darDeBajaSocio, obtenerSocios };