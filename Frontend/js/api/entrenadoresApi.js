import { request } from "./client.js";

// ==========================================================
// API / ENTRENADORES (STAFF)
// ==========================================================

const RUTA = "/staff";

// El backend exige el rol en cada alta
const conRol = (datos) => ({ ...datos, rol: "Profesor" });

// Obtener entrenadores
export function obtenerEntrenadores() {
  return request(RUTA, { error: "Error al obtener los entrenadores" });
}

// Crear entrenador
export function crearEntrenador(datos) {
  return request(RUTA, {
    method: "POST",
    body: conRol(datos),
    error: "Error al crear el entrenador",
  });
}

// Editar entrenador
export function editarEntrenador(id, datos) {
  return request(`${RUTA}/${id}`, {
    method: "PUT",
    body: conRol(datos),
    error: "Error al editar el entrenador",
  });
}

// Dar de baja
export function darDeBajaEntrenador(id) {
  return request(`${RUTA}/${id}`, {
    method: "PATCH",
    error: "Error al dar de baja al entrenador",
  });
}
