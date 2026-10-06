const { Suscripcion, Socio, Persona, Notificacion } = require('../models');
const {
  fechaEnZona,
  ventanaAvisos,
  obtenerSuscripcionesParaAvisar,
  generarMensaje
} = require('../services/avisosService');

const ESTADOS_VALIDOS = ['Pendiente', 'Enviado', 'Error'];
const LIMITE_DEFECTO = 50;
const LIMITE_MAXIMO = 200;

const historial = async (req, res) => {
  try {
    const { estado, limite } = req.query;

    if (estado && !ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ error: 'estado debe ser Pendiente, Enviado o Error.' });
    }

    const limiteNum = limite === undefined ? LIMITE_DEFECTO : Number(limite);
    if (!Number.isInteger(limiteNum) || limiteNum < 1 || limiteNum > LIMITE_MAXIMO) {
      return res.status(400).json({ error: `limite debe ser un entero entre 1 y ${LIMITE_MAXIMO}.` });
    }

    const zona = process.env.AVISOS_TIMEZONE || 'America/Buenos_Aires';
    const hoy = fechaEnZona(new Date(), zona);
    const where = estado ? { estado } : {};

    const [notificaciones, total, enviados, enviadosHoy] = await Promise.all([
      Notificacion.findAll({
        where,
        include: [{
          model: Suscripcion,
          required: true,
          include: [{
            model: Socio,
            required: true,
            include: [{ model: Persona, required: true }]
          }]
        }],
        order: [['notificacionId', 'DESC']],
        limit: limiteNum
      }),
      Notificacion.count(),
      Notificacion.count({ where: { estado: 'Enviado' } }),
      Notificacion.count({ where: { estado: 'Enviado', fechaEnvio: hoy } })
    ]);

    return res.status(200).json({
      resumen: { total, enviados, hoy: enviadosHoy },
      notificaciones: notificaciones.map((n) => {
        const persona = n.Suscripcion.Socio.Persona;
        return {
          notificacionId: n.notificacionId,
          suscripcionId: n.suscripcionId,
          socio: `${persona.nombre} ${persona.apellido}`,
          email: persona.email,
          fechaVencimiento: n.Suscripcion.fechaVencimiento,
          fechaProgramada: n.fechaProgramada,
          fechaEnvio: n.fechaEnvio,
          estado: n.estado
        };
      })
    });
  } catch (error) {
    console.error('Error al obtener el historial de avisos:', error);
    return res.status(500).json({ error: 'Error interno al obtener el historial de avisos.' });
  }
};

// Próximos avisos: qué se enviaría en la próxima corrida del cron.
// Cubre toda la ventana de aviso (hoy .. hoy + AVISOS_DIAS_ANTES).
// Solo lectura: no crea notificaciones ni manda correos.
// La verificación es igual que el envío real: 1 aviso por persona y día
// (claveEnvio = personaId:fechaActual), así que una persona con varias
// suscripciones en la ventana aparece UNA sola vez (la más urgente).
const pendientes = async (req, res) => {
  try {
    const ahora = new Date();
    const zona = process.env.AVISOS_TIMEZONE || 'America/Buenos_Aires';
    const hoy = fechaEnZona(ahora, zona);
    const { desde, hasta } = ventanaAvisos(ahora);
    const suscripciones = await obtenerSuscripcionesParaAvisar(ahora);

    const personasParaAvisar = new Set(
      suscripciones.map((s) => s.Socio.Persona.personaId)
    );

    const clavesAvisadasHoy = personasParaAvisar.size
      ? await Notificacion.findAll({
          where: { claveEnvio: [...personasParaAvisar].map((id) => `${id}:${hoy}`) },
          attributes: ['claveEnvio']
        })
      : [];

    const avisadasHoy = new Set(
      clavesAvisadasHoy.map((n) => n.claveEnvio.split(':')[0])
    );

    // Ya viene ordenada por vencimiento ASC: la primera suscripción que
    // aparece de una persona es la que se enviaría (la más cercana).
    const vistos = new Set();

    const porAvisar = suscripciones.filter((s) => {
      const personaId = String(s.Socio.Persona.personaId);
      if (avisadasHoy.has(personaId) || vistos.has(personaId)) return false;
      vistos.add(personaId);
      return true;
    });

    return res.status(200).json({
      desde,
      hasta,
      fechaObjetivo: hasta,
      total: porAvisar.length,
      pendientes: porAvisar.map((s) => {
        const persona = s.Socio.Persona;
        const correo = generarMensaje(s);

        return {
          suscripcionId: s.suscripcionId,
          socio: `${persona.nombre} ${persona.apellido}`,
          email: persona.email,
          telefono: persona.telefono || null,
          fechaVencimiento: s.fechaVencimiento,
          asunto: correo.asunto,
          mensaje: correo.mensaje
        };
      })
    });
  } catch (error) {
    console.error('Error al consultar los avisos próximos:', error);
    return res.status(500).json({ error: 'Error interno al consultar los avisos próximos.' });
  }
};

module.exports = { historial, pendientes };