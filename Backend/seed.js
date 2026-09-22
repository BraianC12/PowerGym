const sequelize = require('./config/database'); 
const { Persona, Administrador } = require('./models'); 

const cargarSemillas = async () => {
    try {
        await sequelize.sync(); 

        const adminExistente = await Administrador.findOne({ where: { nombreUsuario: 'admin_dueno' } });
        if (!adminExistente) {
            console.log('Creando datos semilla: ');

            // crear Dueño
            const personaDueno = await Persona.create({ 
                nombre: 'Carlos', apellido: 'Gómez', telefono: '1100000001', email: 'dueno@powergym.com' 
            });
            await Administrador.create({ 
                nombreUsuario: 'admin_dueno', contrasena: 'clave123', rol: 'Dueño', personaId: personaDueno.personaId
            });

            // crear Profesor 1
            const personaProfe1 = await Persona.create({ 
                nombre: 'Laura', apellido: 'Martínez', telefono: '1100000002', email: 'laura@powergym.com' 
            });
            await Administrador.create({ 
                nombreUsuario: 'profe_laura', contrasena: 'clave123', rol: 'Profesor', personaId: personaProfe1.personaId
            });

            // crear Profesor 2
            const personaProfe2 = await Persona.create({ 
                nombre: 'Martín', apellido: 'López', telefono: '1100000003', email: 'martin@powergym.com' 
            });
            await Administrador.create({ 
                nombreUsuario: 'profe_martin', contrasena: 'clave123', rol: 'Profesor', personaId: personaProfe2.personaId
            });

            console.log('Datos semilla creados correctamente.');
        } else {
            console.log('Los datos semilla ya habían sido creados previamente.');
        }

        // Prueba
        const todosLosAdmins = await Administrador.findAll();
        console.log(`Cantidad de Administradores guardados: ${todosLosAdmins.length}`);
        console.log(JSON.stringify(todosLosAdmins, null, 2));
        

        process.exit();

    } catch (error) {
        console.error('Error al cargar los datos semilla:', error);
        process.exit(1);
    }
};

cargarSemillas();