// ==========================================================
// API / SUSCRIPCIONES
// Normaliza la respuesta del backend al formato que usa la
// tabla de vencimientos.
// ==========================================================

import { request } from "./client.js";
import { fechaLocal, hoyISO } from "../components/dom.js";

const RUTA = "/suscripciones";

// Convierte cada registro de obtenerVencimientos al formato de la tabla
export function normalizarVencimiento(v) {
  const inicio = fechaLocal(v.fechaInicio);
  const fecha = fechaLocal(v.fechaVencimiento);
  const hoy = fechaLocal(hoyISO());
  const dias = fecha ? Math.round((fecha - hoy) / 86400000) : null;

  let estado = "vigente";
  if (v.estado === "Cancelada") estado = "cancelada";
  else if (dias !== null && dias < 0) estado = "vencido";
  else if (dias === 0) estado = "hoy";
  else if (dias !== null && dias <= 5) estado = "proximo"; // mismo criterio que el backend (5 días)

  return {
    socioId: v.socioId,
    nombre: v.socio || "Socio desconocido",
    contacto: v.contacto || "-",
    inicio,
    fecha,
    dias,
    estado,
    comentario: v.comentario || "",
  };
}

// Vencimientos
export async function obtenerVencimientos() {
  const data = await request(`${RUTA}/vencimientos`, {
    error: "Error al obtener los vencimientos",
  });

  return (Array.isArray(data) ? data : data.vencimientos || []).map(
    normalizarVencimiento,
  );
}

// Socios activos, para el selector del modal
export async function obtenerSociosActivos() {
  const socios = await request("/socios", { error: "Error al obtener los socios" });

  return socios.filter((s) => String(s.estado).toLowerCase() === "activo");
}

// Crear suscripción
export function crearSuscripcion(suscripcion) {
  return request(RUTA, {
    method: "POST",
    body: suscripcion,
    error: "Error al crear la suscripción",
  });
}
export function renovarSuscripcion(socioId, datos = {}) {
  return request(`${RUTA}/renovar/${socioId}`, {
    method: "POST",
    body: datos,
    error: "Error al renovar la suscripción",
  });
}