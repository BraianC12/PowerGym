const nodemailer = require("nodemailer")

let transporter

function obtenerTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_REQUIRE_TLS } =
    process.env

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !SMTP_FROM) {
    throw new Error("Falta completar la configuración SMTP en el .env.")
  }
  const port = Number(SMTP_PORT || 587);

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("SMTP_PORT debe ser un puerto válido.");
  }

  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: SMTP_SECURE === "true",
      requireTLS: SMTP_REQUIRE_TLS !== "false",
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false
      },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 30000,
    })
  }
  return transporter
}

async function enviarCorreo({ destinatario, asunto, mensaje }) {
  if (
    typeof destinatario !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destinatario)
  ) {
    throw new Error("El destinatario debe tener un email válido.");
  }
  const resultado = await obtenerTransporter().sendMail({
    from: process.env.SMTP_FROM,
    to: destinatario,
    subject: asunto,
    text: mensaje,
  });
  if (!resultado.accepted || resultado.accepted.length === 0) {
    throw new Error("El servidor SMTP no aceptó el destinatario.");
  }
  return { messageId: resultado.messageId };
}

module.exports = { enviarCorreo };
