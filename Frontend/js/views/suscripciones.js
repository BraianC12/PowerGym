// ==========================================================
// VIEW / SUSCRIPCIONES
// Vencimientos: tabla, filtros, contadores y alta de
// suscripción. Los datos vienen de api/suscripcionesApi.js.
// ==========================================================

import { $, esc, hoyISO, textoDias } from "../components/dom.js";
import { abrir, cerrar, conectarCierre } from "../components/modal.js";
import {
  obtenerVencimientos,
  obtenerSociosActivos,
  crearSuscripcion,
} from "../api/suscripcionesApi.js";

import { exigirSesion } from "../api/sesion.js";

exigirSesion();

const ETIQUETA = {
  vigente: "Vigente",
  proximo: "Próximo",
  hoy: "Vence hoy",
  vencido: "Vencido",
  cancelada: "Cancelada",
};

let vencimientos = [];

const modal = $("modalSuscripcion");
const form = $("formSuscripcion");
const msg = $("form-msg-suscripcion");

// ======================================================
// CARGAR
// ======================================================

async function cargarVencimientos() {
  try {
    vencimientos = await obtenerVencimientos();
    render();
  } catch (error) {
    console.error(error);
    $("tablaVencimientos").innerHTML = `<tr><td colspan="7" class="msg-fila">No se pudieron cargar los vencimientos. Revisá que la API esté corriendo.</td></tr>`;
  }
}

// ======================================================
// RENDER
// ======================================================

function render() {
  $("statHoy").textContent = vencimientos.filter((v) => v.estado === "hoy").length;
  $("statProximos").textContent = vencimientos.filter((v) => v.estado === "proximo").length;
  $("statVencidos").textContent = vencimientos.filter((v) => v.estado === "vencido").length;

  const q = $("buscarSocio").value.trim().toLowerCase();
  const fe = $("filtroEstado").value;
  const orden = $("ordenar").value;

  const lista = vencimientos
    .filter(
      (v) =>
        (fe === "todos" || v.estado === fe) &&
        (!q || `${v.nombre} ${v.contacto}`.toLowerCase().includes(q)),
    )
    .sort((a, b) => {
      if (orden === "nombre") return a.nombre.localeCompare(b.nombre);
      const x = a.fecha ? a.fecha.getTime() : Infinity;
      const y = b.fecha ? b.fecha.getTime() : Infinity;
      return orden === "vencimiento-desc" ? y - x : x - y;
    });

  const tbody = $("tablaVencimientos");

  if (lista.length === 0) {
    const txt =
      vencimientos.length === 0
        ? "Todavía no hay suscripciones. Creá la primera con “+ Nueva suscripción”."
        : "Ningún socio coincide con los filtros.";
    tbody.innerHTML = `<tr><td colspan="7" class="msg-fila">${txt}</td></tr>`;
    return;
  }

  tbody.innerHTML = lista
    .map(
      (v) => `
    <tr>
      <td>${esc(v.nombre)}</td>
      <td>${esc(v.contacto)}</td>
      <td>${v.inicio ? v.inicio.toLocaleDateString("es-AR") : "-"}</td>
      <td>${v.fecha ? v.fecha.toLocaleDateString("es-AR") : "-"}</td>
      <td>${textoDias(v.dias)}</td>
      <td><span class="estado ${v.estado}">${ETIQUETA[v.estado]}</span></td>
      <td><button class="action-btn">Avisar</button></td>
    </tr>`,
    )
    .join("");
}

// ======================================================
// FILTROS
// ======================================================

["buscarSocio", "filtroEstado", "ordenar"].forEach((id) =>
  $(id).addEventListener(id === "buscarSocio" ? "input" : "change", render),
);

$("limpiarFiltros").addEventListener("click", () => {
  $("buscarSocio").value = "";
  $("filtroEstado").value = "todos";
  $("ordenar").value = "vencimiento-asc";
  render();
});

// ======================================================
// MODAL: NUEVA SUSCRIPCIÓN
// ======================================================

async function cargarSocios() {
  const select = $("socioId");
  select.innerHTML = `<option value="">Cargando socios...</option>`;

  try {
    const socios = await obtenerSociosActivos();

    if (socios.length === 0) {
      select.innerHTML = `<option value="">No hay socios activos</option>`;
      return;
    }

    select.innerHTML =
      `<option value="">Elegí un socio</option>` +
      socios
        .map(
          (s) =>
            `<option value="${Number(s.socioId)}">${esc(s.Persona.nombre)} ${esc(s.Persona.apellido)}</option>`,
        )
        .join("");
  } catch {
    select.innerHTML = `<option value="">No se pudieron cargar los socios</option>`;
  }
}

function abrirModal() {
  msg.className = "form__msg";
  msg.textContent = "";

  const hoy = hoyISO();
  $("fechaInicio").value = hoy;
  form.fechaInicio.min = "";
  form.fechaVencimiento.min = "";

  abrir(modal);
  cargarSocios();
}

function cerrarModal() {
  cerrar(modal);
  form.reset();
}

form.fechaInicio.addEventListener("change", () => {
  form.fechaVencimiento.min = form.fechaInicio.value;
});

$("btnNuevaSuscripcion").addEventListener("click", abrirModal);
conectarCierre(modal, $("btnCerrarModal"), () => form.reset());

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const suscripcion = {
    socioId: Number(form.socioId.value),
    fechaInicio: form.fechaInicio.value,
    fechaVencimiento: form.fechaVencimiento.value,
  };

  if (!suscripcion.socioId || !suscripcion.fechaInicio || !suscripcion.fechaVencimiento) {
    msg.className = "form__msg error";
    msg.textContent = "Elegí un socio y completá las fechas de inicio y vencimiento.";
    return;
  }

  if (suscripcion.fechaVencimiento <= suscripcion.fechaInicio) {
    msg.className = "form__msg error";
    msg.textContent = "El vencimiento tiene que ser posterior a la fecha de inicio.";
    return;
  }

  try {
    await crearSuscripcion(suscripcion);
    cerrarModal();
    cargarVencimientos();
  } catch (error) {
    msg.className = "form__msg error";
    msg.textContent = error.message;
  }
});

// ======================================================
// INICIAR
// ======================================================

document.addEventListener("DOMContentLoaded", cargarVencimientos);
