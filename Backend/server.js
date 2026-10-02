require('dotenv').config();
const app = require('./app')
const{sequelize}=require('./models')
const authRoutes = require('./routes/authRoutes');

const PORT = process.env.PORT || 3000;

// Sincronizar Base de Datos y arrancar el servidor
sequelize.sync()
  .then(() => {
    console.log('Base de datos conectada y sincronizada.');
    app.listen(PORT, () => {
      console.log(`Servidor de PowerGym corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error al sincronizar la base de datos:', error);
    process.exitCode = 1;
  });

app.use('/api', authRoutes);
