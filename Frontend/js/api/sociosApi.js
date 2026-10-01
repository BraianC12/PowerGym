import { request } from "./client.js";

// ==========================================================
// API / SOCIOS
// ==========================================================

const RUTA = "/socios";

// Obtener todos los socios
export function obtenerSocios() {
  return request(RUTA, { error: "Error al obtener los socios" });
}

// Crear socio
export function crearSocio(socio) {
  return request(RUTA, {
    method: "POST",
    body: socio,
    error: "Error al crear el socio",
  });
}

// Editar socio
export function editarSocio(socioId, datos) {
  return request(`${RUTA}/${socioId}`, {
    method: "PUT",
    body: datos,
    error: "Error al editar el socio",
  });
}

// Dar de baja
export function darDeBajaSocio(socioId) {
  return request(`${RUTA}/${socioId}`, {
    method: "PATCH",
    error: "Error al dar de baja",
  });
}
