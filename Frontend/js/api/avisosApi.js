// ==========================================================
// API / AVISOS
// Historial de avisos de vencimiento. Habla con
// GET /api/avisos y normaliza la respuesta al formato que
// usa la tabla de la vista.
// ==========================================================

import { request } from "./client.js";
import { fechaLocal } from "../components/dom.js";

const RUTA = "/avisos";

// Cada notificación del backend -> fila de la tabla
export function normalizarNotificacion(n) {
  const estado = String(n.estado || "").toLowerCase();

  return {
    id: n.notificacionId,
    socio: n.socio || "Socio desconocido",
    email: n.email || "-",
    vencimiento: fechaLocal(n.fechaVencimiento),
    fechaEnvio: fechaLocal(n.fechaEnvio),
    // El backend solo conoce estos tres estados
    estado: ["enviado", "pendiente", "error"].includes(estado) ? estado : "error",
  };
}

// Cada próximo aviso -> fila de la tabla de pendientes
export function normalizarPendiente(p) {
  return {
    suscripcionId: p.suscripcionId,
    socio: p.socio || "Socio desconocido",
    email: p.email || "-",
    vencimiento: fechaLocal(p.fechaVencimiento),
  };
}

// Próximos avisos: los vencimientos dentro de la ventana de aviso
// (hoy .. hoy + días antes) que todavía no fueron avisados.
// GET /api/avisos/pendientes (no escribe ni manda nada).
export async function obtenerPendientes() {
  const data = await request(`${RUTA}/pendientes`, {
    error: "Error al obtener los próximos avisos",
  });

  return {
    desde: data.desde || null,
    hasta: data.hasta || data.fechaObjetivo || null,
    fechaObjetivo: data.fechaObjetivo || null,
    total: Number(data.total) || 0,
    pendientes: (Array.isArray(data.pendientes) ? data.pendientes : []).map(
      normalizarPendiente,
    ),
  };
}

// Historial completo con sus contadores.
// estado: "Enviado" | "Pendiente" | "Error" (opcional)
// limite: cantidad de filas a traer (opcional)
export async function obtenerHistorial({ estado, limite } = {}) {
  const params = new URLSearchParams();

  if (estado && estado !== "todos") params.set("estado", estado);
  if (limite) params.set("limite", String(limite));

  const qs = params.toString();

  const data = await request(`${RUTA}${qs ? `?${qs}` : ""}`, {
    error: "Error al obtener el historial de avisos",
  });

  return {
    resumen: data.resumen || { total: 0, enviados: 0, hoy: 0 },
    notificaciones: (Array.isArray(data.notificaciones)
      ? data.notificaciones
      : []
    ).map(normalizarNotificacion),
  };
}
