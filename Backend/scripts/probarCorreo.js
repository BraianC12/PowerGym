require('dotenv').config();

const { enviarCorreo } = require('../services/correoService');

async function probarCorreo() {
  try {
    const resultado = await enviarCorreo({
      destinatario: process.env.SMTP_USER,
      asunto: 'Prueba de correo de PowerGym',
      mensaje: 'Este es un correo de prueba para comprobar la conexión SMTP de PowerGym.'
    });

    console.log('El servidor SMTP aceptó el correo.');
    console.log('ID del mensaje:', resultado.messageId);
  } catch (error) {
    console.error('No se pudo enviar el correo:', error.message);
    process.exitCode = 1;
  }
}

probarCorreo();