const express = require('express');
const { sequelize } = require('./models');
const socioRoutes = require('./routes/socioRoutes');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware para que Express entienda JSON
app.use(express.json());
//sin los headers CORS la petición se rechaza. app.use(cors()) 
app.use(cors());
// Rutas de la API
app.use('/api/socios', socioRoutes);

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