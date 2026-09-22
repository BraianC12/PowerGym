const express = require('express');
const { sequelize } = require('./models');
const socioRoutes = require('./routes/socioRoutes');
const administradorRoutes = require('./routes/administradorRoutes');
require('dotenv').config();

const app = express();

// Middleware para que Express entienda JSON
app.use(express.json());

// Rutas de la API
app.use('/api/socios', socioRoutes);
app.use('/api/staff', administradorRoutes);


const PORT = process.env.PORT || 3000;

// Sincronizar Base de Datos y arrancar el servidor
sequelize.sync({ alter: true })
  .then(() => {
    console.log('Base de datos conectada y sincronizada.');
    app.listen(PORT, () => {
      console.log(`Servidor de PowerGym corriendo en http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error al sincronizar la BD:', error);
  });