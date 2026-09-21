const { Persona, Socio } = require('../models');

const crearSocio = async (req, res) => {
  try {
    const { nombre, apellido, telefono, email } = req.body;

    // Instanciamos y guardamos el objeto Padre (Persona)
    const nuevaPersona = await Persona.create({ nombre, apellido, telefono, email });
    
    // Instanciamos y guardamos el objeto Hijo (Socio) vinculándolo al Padre
    const nuevoSocio = await Socio.create({ socioId: nuevaPersona.personaId });

    res.status(201).json({ 
      mensaje: 'Socio creado exitosamente', 
      persona: nuevaPersona,
      socio: nuevoSocio 
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar', detalle: error.message });
  }
};

const darDeBajaSocio = async (req, res) => {
  try {
    // Buscamos la instancia del objeto
    const socio = await Socio.findByPk(req.params.id);
    if (!socio) return res.status(404).json({ error: 'Socio no encontrado' });

    // Modificamos las propiedades del objeto y guardamos
    socio.estado = 'Inactivo';
    socio.fechaBaja = new Date();
    await socio.save();

    res.json({ mensaje: 'Baja lógica exitosa', socio });
  } catch (error) {
    res.status(500).json({ error: 'Error', detalle: error.message });
  }
};

const obtenerSocios = async (req, res) => {
  try {
    const socios = await Socio.findAll({
      where: { estado: 'Activo' },
      include: [{ model: Persona }] // Trae los datos heredados
    });
    res.json(socios);
  } catch (error) {
    res.status(500).json({ error: 'Error', detalle: error.message });
  }
};

module.exports = { crearSocio, darDeBajaSocio, obtenerSocios };