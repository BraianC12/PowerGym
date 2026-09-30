const { Persona, Socio,Suscripcion,Membresia,sequelize } = require('../models');

const crearSocio = async (req, res) => {
  try {
    const { nombre, apellido, telefono, email } = req.body||{};

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

    
const { nuevaPersona, nuevoSocio } = await sequelize.transaction(async (transaction) => {
    const nuevaPersona = await Persona.create({nombre,apellido,telefono,email},{transaction})
    const nuevoSocio = await Socio.create({socioId: nuevaPersona.personaId},{transaction})
    return { nuevaPersona, nuevoSocio }})


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
      include: [{ model: Persona }] // Trae los datos heredados
    });
    res.json(socios);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener la lista', detalle: error.message });
  }
};


const obtenerSocioPorId=async(req,res)=>{
  try{
    const socio=await Socio.findByPk(req.params.id,{include:[{model:Persona},{model:Suscripcion,include:[{model:Membresia,as:"Membresia"}]}]})

    if(!socio){return res.status(404).json({error:"Socio no encontrado"})} return res.json(socio)
  }catch (error){return res.status(500).json({error:"Error al obtener el socio", detalle:error.message})}
}



const editarSocio = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isSafeInteger(id)||id<=0) {
      return res.status(400).json({ error: "El ID debe ser un numero entero positivo." });
    }

    const body=req.body
    if (!body||typeof body !== 'object' || Array.isArray(body)){return res.status(400).json({error: 'Tenés que enviar los datos a modificar'})}

    const camposPermitidos=['nombre','apellido','telefono','email']
    const cambios={}
    for(const campo of Object.keys(body)){
      if(!camposPermitidos.includes(campo)){return res.status(400).json({error:`El campo '${campo}' no se puede modificar`})}
    
      if(typeof body[campo]!== 'string'){return res.status(400).json({error:`El campo '${campo}' debe ser texto`})}
    
      cambios[campo]=body[campo].trim()

      if(campo!== 'telefono'&& cambios[campo]===''){return res.status(400).json({error:`El campo '${campo}' no puede quedar vacio`})}
    }

    if(Object.keys(cambios).length===0){return res.status(400).json({error: 'Tenés que enviar al menos un campo para modificar'});
    }

    if (cambios.email !== undefined) {const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if(!regexEmail.test(cambios.email)){return res.status(400).json({error:'El formato del correo electronico no es valido'})}
    }
      
    const socio= await Socio.findByPk(id,{include:[{model:Persona}]})
    if(!socio){return res.status(404).json({error:'Socio no encontrado.'})}
    
    if(cambios.email !== undefined && cambios.email !== socio.Persona.email){
      const personaExistente=await Persona.findOne({where:{email:cambios.email}})
      if(personaExistente){return res.status(400).json({error: 'El correo electronico ya está en uso'})}}
      
    

    //actualizar la informacion
    await socio.Persona.update(cambios)

    return res.status(200).json({mensaje: "Datos del socio actualizados correctamente",socio});
    } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'El correo electrónico ya está en uso.'});
    }
  console.error('Error al actualizar el socio:', error);

    return res.status(500).json({error: 'Error interno al modificar los datos.'});
  }
};

module.exports = { crearSocio, darDeBajaSocio, obtenerSocios, obtenerSocioPorId,editarSocio };
