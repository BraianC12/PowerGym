// ==========================================================
// COMPONENTS / DOM
// Helpers de bajo nivel que se repiten en varias vistas.
// ==========================================================

// Buscar un elemento por id
export const $ = (id) => document.getElementById(id);

// Escapar texto antes de inyectarlo en un template
export const esc = (texto) =>
  String(texto ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c],
  );

// "2026-01-31" -> Date local (sin desfase de zona horaria)
export function fechaLocal(str) {
  if (!str) return null;
  const [y, m, d] = String(str).slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

// Fecha de hoy en formato YYYY-MM-DD
export function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Días restantes con redacción
export function textoDias(d) {
  if (d === null) return "-";
  if (d < 0) return `Hace ${-d} ${-d === 1 ? "día" : "días"}`;
  if (d === 0) return "Hoy";
  return `${d} ${d === 1 ? "día" : "días"}`;
}
