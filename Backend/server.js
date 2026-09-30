const express = require('express');
const { sequelize } = require('./models');
const socioRoutes = require('./routes/socioRoutes');
const cors = require('cors');
const administradorRoutes = require('./routes/administradorRoutes');
const suscripcionRoutes = require('./routes/vencimientosRoutes');

require('dotenv').config();

const app = express();


app.use(express.json());
app.use(cors());
// Rutas de la API
app.use('/api/socios', socioRoutes);
app.use('/api/staff', administradorRoutes);
app.use('/api/suscripciones', suscripcionRoutes);

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
    console.error('Error al sincronizar la BD:', error);
  });
  