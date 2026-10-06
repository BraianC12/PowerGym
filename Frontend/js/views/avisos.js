// ==========================================================
// VIEW / AVISOS
// Dos bloques con datos reales del backend:
//   1. Próximos avisos  -> GET /api/avisos/pendientes (dry run)
//   2. Historial        -> GET /api/avisos (notificaciones)
// Los datos entran por api/avisosApi.js.
// ==========================================================

import { $, esc, textoDias } from "../components/dom.js";
import { notificacion } from "../components/notifications.js";
import { obtenerHistorial, obtenerPendientes } from "../api/avisosApi.js";
import { exigirSesion } from "../api/sesion.js";

exigirSesion();

const ETIQUETA = { enviado: "Enviado", pendiente: "Pendiente", error: "Error" };

// Clases de badges.css
const BADGE = { enviado: "sent", pendiente: "pending", error: "failed" };

const COLUMNAS = { proximos: 4, historial: 6 };

// ======================================================
// HELPERS
// ======================================================

function fila(columnas, texto) {
  return `<tr><td colspan="${columnas}" class="msg-fila">${texto}</td></tr>`;
}

function fechaCorta(fecha) {
  return fecha ? fecha.toLocaleDateString("es-AR") : "-";
}

// "2026-10-11" -> "11/10/2026" (sin pasarlo por Date: no se corre de zona)
function fechaISO(iso) {
  if (!iso) return "-";
  const [anio, mes, dia] = String(iso).slice(0, 10).split("-");
  return `${dia}/${mes}/${anio}`;
}

function diasRestantes(vencimiento) {
  if (!vencimiento) return null;

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  return Math.round((vencimiento - hoy) / 86400000);
}

// ======================================================
// PRÓXIMOS AVISOS
// ======================================================

function pintarProximos({ desde, hasta, fechaObjetivo, pendientes }) {
  const fin = hasta || fechaObjetivo;

  $("statProximos").textContent = pendientes.length;
  $("proximosBajada").textContent = fin
    ? `Ventana de aviso: ${desde ? fechaISO(desde) : "…"} → ${fechaISO(fin)}.`
    : "Se enviarían en la próxima corrida automática.";

  const tbody = $("tablaProximos");

  if (pendientes.length === 0) {
    tbody.innerHTML = fila(
      COLUMNAS.proximos,
      fin
        ? `No hay avisos pendientes hasta el ${fechaISO(fin)}.`
        : "No hay avisos pendientes.",
    );
    return;
  }

  tbody.innerHTML = pendientes
    .map(
      (p) => `
    <tr>
      <td>${esc(p.socio)}</td>
      <td>${esc(p.email)}</td>
      <td>${fechaCorta(p.vencimiento)}</td>
      <td>${textoDias(diasRestantes(p.vencimiento))}</td>
    </tr>`,
    )
    .join("");
}

function pintarErrorProximos(motivo) {
  $("statProximos").textContent = "-";
  $("proximosBajada").textContent = motivo;
  $("tablaProximos").innerHTML = fila(COLUMNAS.proximos, motivo);
}

// ======================================================
// HISTORIAL
// ======================================================

function pintarResumen(resumen) {
  $("statTotal").textContent = resumen.total;
  $("statEnviados").textContent = resumen.enviados;
  $("statHoy").textContent = resumen.hoy;
}

function pintarHistorial(notificaciones) {
  const tbody = $("tablaHistorial");

  if (notificaciones.length === 0) {
    tbody.innerHTML = fila(COLUMNAS.historial, "Todavía no se registraron avisos de vencimiento.");
    return;
  }

  tbody.innerHTML = notificaciones
    .map((n) => {
      const dias = diasRestantes(n.vencimiento);

      return `
    <tr>
      <td>${esc(n.socio)}</td>
      <td>${esc(n.email)}</td>
      <td>${fechaCorta(n.vencimiento)}</td>
      <td>${textoDias(dias)}</td>
      <td>${fechaCorta(n.fechaEnvio)}</td>
      <td><span class="status ${BADGE[n.estado]}">${ETIQUETA[n.estado]}</span></td>
    </tr>`;
    })
    .join("");
}

function pintarErrorHistorial(motivo) {
  pintarResumen({ total: 0, enviados: 0, hoy: 0 });
  $("tablaHistorial").innerHTML = fila(COLUMNAS.historial, motivo);
}

// ======================================================
// CARGAR
// ======================================================

// 403 = el usuario no es Dueño; el resto es un problema de la API.
const mensajeError = (error, mensajeApi) =>
  error.estado === 403
    ? "Se requiere rol Dueño para ver los avisos."
    : mensajeApi;

async function cargarProximos() {
  $("tablaProximos").innerHTML = fila(COLUMNAS.proximos, "Cargando próximos avisos...");

  try {
    pintarProximos(await obtenerPendientes());
  } catch (error) {
    if (error.estado !== 403) console.error(error);
    pintarErrorProximos(
      mensajeError(error, "No se pudieron cargar los próximos avisos. Revisá que la API esté corriendo."),
    );
  }
}

async function cargarHistorial() {
  $("tablaHistorial").innerHTML = fila(COLUMNAS.historial, "Cargando historial...");

  try {
    const { resumen, notificaciones } = await obtenerHistorial({
      estado: $("filtroEstado").value,
    });

    pintarResumen(resumen);
    pintarHistorial(notificaciones);
  } catch (error) {
    if (error.estado !== 403) console.error(error);
    pintarErrorHistorial(
      mensajeError(error, "No se pudo cargar el historial. Revisá que la API esté corriendo."),
    );
  }
}

async function cargar() {
  await Promise.all([cargarProximos(), cargarHistorial()]);
}

// ======================================================
// FILTRO Y REFRESCO
// ======================================================

$("filtroEstado").addEventListener("change", cargarHistorial);

$("btnActualizar").addEventListener("click", async () => {
  await cargar();
  notificacion("Datos actualizados.");
});

// ======================================================
// INICIAR
// ======================================================

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", cargar);
} else {
  cargar();
}
