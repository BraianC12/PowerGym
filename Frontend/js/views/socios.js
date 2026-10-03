// ---- Conexión con la API ----
import {
  obtenerSocios,
  crearSocio,
  editarSocio,
  darDeBajaSocio,
} from "../api/sociosApi.js";

// ---- Componentes ----
import { $, esc } from "../components/dom.js";
import { abrir, cerrar, conectarCierre } from "../components/modal.js";
import { exigirSesion } from "../api/sesion.js";

exigirSesion();

// ---- Variables ----

let sociosCargados = [];
let filtroEstado = "todos";
let cargaOk = false;

// ---- Elementos del HTML ----

const tbody = $("tablaSocios");
const mensaje = $("sinResultados");
const buscador = $("buscarSocio");
const chips = document.querySelectorAll(".chip");
const tabla = $("tablaWrap");
const estadoVacio = $("estadoVacio");

const MSG_SIN_RESULTADOS =
  "Ningún socio coincide con la búsqueda o el filtro.";

const MSG_ERROR =
  "No se pudo conectar con el servidor. Revisá que la API esté corriendo en localhost:3000.";


// ======================================================
// HELPERS PROPIOS DE LA VISTA
// ======================================================

function claseEstado(estado) {
  const t = String(estado || "").toLowerCase();

  if (t.includes("inactiv") || t.includes("baja")) {
    return "inactivo";
  }


  if (t.includes("activ")) {
    return "activo";
  }

  return "inactivo";
}

function esInactivo(socio) {
  return claseEstado(socio && socio.estado) === "inactivo";
}


// ======================================================
// CARGAR SOCIOS
// ======================================================

async function cargarSocios() {
  try {
    sociosCargados = await obtenerSocios();

    cargaOk = true;

    render();

  } catch (error) {
    console.error(error);

    cargaOk = false;

    mostrarError();
  }
}


// ======================================================
// FILTRAR SOCIOS
// ======================================================

function listaFiltrada() {
  const q = buscador.value.trim().toLowerCase();

  return sociosCargados.filter((s) => {
    const p = s.Persona;

    const okEstado =
      filtroEstado === "todos" ||
      claseEstado(s.estado) === filtroEstado;

    const okTexto =
      !q ||
      `${p.nombre} ${p.apellido} ${p.email} ${p.telefono || ""}`
        .toLowerCase()
        .includes(q);

    return okEstado && okTexto;
  });
}


// ======================================================
// RENDER DE LA TABLA
// ======================================================

function render() {
  actualizarContadores(sociosCargados);

  // No hay ningún socio registrado
  if (sociosCargados.length === 0) {
    tbody.innerHTML = "";

    tabla.style.display = "none";

    mensaje.classList.remove("show");

    estadoVacio.classList.add("show");

    return;
  }

  // Hay socios: mostrar tabla
  estadoVacio.classList.remove("show");

  tabla.style.display = "";

  const lista = listaFiltrada();

  // Hay socios pero el filtro/buscador no encuentra ninguno
  if (lista.length === 0) {
    tbody.innerHTML = "";

    mensaje.textContent = MSG_SIN_RESULTADOS;

    mensaje.classList.add("show");

    return;
  }

  mensaje.classList.remove("show");

  tbody.innerHTML = lista
    .map((s) => {
      const p = s.Persona;

      // Un socio dado de baja no se puede editar
      // ni volver a dar de baja
      const bloqueado = esInactivo(s)
        ? 'disabled title="El socio está dado de baja"'
        : "";

      return `
        <tr>

          <td>
            <div class="who">
              <span>
                ${esc(p.nombre)} ${esc(p.apellido)}
              </span>
            </div>
          </td>

      <td>
  ${esc(p.telefono || "")}
</td>

<td>
  ${esc(p.email || "")}
</td>
       <td>
            <span class="badge ${claseEstado(s.estado)}">
              ${esc(s.estado)}
            </span>
          </td>

          <td>

            <button
              class="action-btn edit"
              ${bloqueado}
              onclick="abrirEditarSocio(${Number(s.socioId)})"
            >
              Editar
            </button>

            <button
              class="action-btn delete"
              ${bloqueado}
              onclick="darDeBaja(${Number(s.socioId)})"
            >
              Dar de baja
            </button>

          </td>

        </tr>
      `;
    })
    .join("");
}


// ======================================================
// MOSTRAR ERROR
// ======================================================

function mostrarError() {
  tbody.innerHTML = "";

  tabla.style.display = "none";

  estadoVacio.classList.remove("show");

  mensaje.textContent = MSG_ERROR;

  mensaje.classList.add("show");
}


// ======================================================
// CONTADORES
// ======================================================

function actualizarContadores(socios) {
  const totalEl = $("totalSocios");
  const activosEl = $("sociosActivos");

  if (totalEl) {
    totalEl.textContent = socios.length;
  }

  if (activosEl) {
    activosEl.textContent = socios.filter(
      (s) => claseEstado(s.estado) === "activo",
    ).length;
  }
}


// ======================================================
// BUSCADOR
// ======================================================

buscador.addEventListener("input", () => {
  if (cargaOk) {
    render();
  }
});


// ======================================================
// FILTROS
// ======================================================

chips.forEach((chip) => {
  chip.addEventListener("click", () => {

    filtroEstado = chip.dataset.filtro;

    chips.forEach((c) =>
      c.setAttribute(
        "aria-pressed",
        c === chip ? "true" : "false",
      ),
    );

    if (cargaOk) {
      render();
    }
  });
});


// ======================================================
// ESTADO VACÍO
// ======================================================

$("btnVacioAgregar").addEventListener("click", () => {
  $("btnAgregarSocio").click();
});


// ======================================================
// MODAL AGREGAR SOCIO
// ======================================================

const modal = $("modalSocio");
const btnAgregar = $("btnAgregarSocio");
const formSocio = $("formSocio");


function limpiarModal() {
  formSocio.reset();
}


// Abrir modal
btnAgregar.addEventListener("click", () => {
  abrir(modal);
});


// Cerrar con el botón y haciendo click afuera
conectarCierre(modal, $("btnCerrarModal"), limpiarModal);


// ======================================================
// FORMULARIO AGREGAR SOCIO
// ======================================================

formSocio.addEventListener("submit", async (e) => {

  e.preventDefault();

  const msg = $("form-msg-socio");

  const socio = {
    nombre: formSocio.nombre.value.trim(),
    apellido: formSocio.apellido.value.trim(),
    telefono: formSocio.telefono.value.trim(),
    email: formSocio.email.value.trim(),
  };


  // Validación
  if (!socio.nombre || !socio.apellido || !socio.email) {

    msg.className = "form__msg error";

    msg.textContent =
      "Completá nombre, apellido y email.";

    return;
  }


  try {

    await crearSocio(socio);

    msg.className = "form__msg";

    msg.textContent = "";

    cerrar(modal);

    limpiarModal();

    cargarSocios();

  } catch (error) {

    msg.className = "form__msg error";

    msg.textContent = error.message;
  }
});


// ======================================================
// MODAL EDITAR SOCIO
// ======================================================

const modalEditar = $("modalEditarSocio");
const btnCerrarEditar = $("btnCerrarEditar");
const formEditar = $("formEditarSocio");

let socioEditandoId = null;


// ======================================================
// ABRIR EDITAR
// ======================================================

function abrirEditarSocio(socioId) {

  const socio = sociosCargados.find(
    (s) =>
      Number(s.socioId) === Number(socioId),
  );


  if (!socio) {

    alert("No se encontró el socio.");

    return;
  }


  // Un socio dado de baja no se puede editar
  if (esInactivo(socio)) {

    alert(
      "Este socio está dado de baja y no se puede editar.",
    );

    return;
  }


  const p = socio.Persona;

  socioEditandoId = socioId;


  $("editarNombre").value =
    p.nombre || "";

  $("editarApellido").value =
    p.apellido || "";

  $("editarTelefono").value =
    p.telefono || "";

  $("editarEmail").value =
    p.email || "";


  $("form-msg-editar").textContent = "";

  $("form-msg-editar").className =
    "form__msg";


  abrir(modalEditar);
}


// ======================================================
// CERRAR EDITAR
// ======================================================

function limpiarModalEditar() {
  formEditar.reset();

  socioEditandoId = null;
}


conectarCierre(modalEditar, btnCerrarEditar, limpiarModalEditar);


// ======================================================
// FORMULARIO EDITAR
// ======================================================

formEditar.addEventListener(
  "submit",
  async (e) => {

    e.preventDefault();

    const msg = $("form-msg-editar");


    const datos = {

      nombre:
        formEditar.nombre.value.trim(),

      apellido:
        formEditar.apellido.value.trim(),

      telefono:
        formEditar.telefono.value.trim(),

      email:
        formEditar.email.value.trim(),

    };


    // Validación
    if (
      !datos.nombre ||
      !datos.apellido ||
      !datos.email
    ) {

      msg.className =
        "form__msg error";

      msg.textContent =
        "Completá nombre, apellido y email.";

      return;
    }


    try {

      await editarSocio(
        socioEditandoId,
        datos,
      );


      cerrar(modalEditar);


      limpiarModalEditar();


      await cargarSocios();


    } catch (error) {

      console.error(error);

      msg.className =
        "form__msg error";

      msg.textContent =
        error.message;
    }
  },
);


// ======================================================
// DAR DE BAJA
// ======================================================

async function darDeBaja(socioId) {

  const socio = sociosCargados.find(
    (s) =>
      Number(s.socioId) === Number(socioId),
  );


  if (!socio) {

    alert("No se encontró el socio.");

    return;
  }


  // Ya está dado de baja
  if (esInactivo(socio)) {

    alert(
      "Este socio ya se encuentra dado de baja.",
    );

    return;
  }


  // Confirmación
  if (
    !confirm(
      "¿Dar de baja a este socio?",
    )
  ) {
    return;
  }


  try {

    await darDeBajaSocio(socioId);

    cargarSocios();

  } catch (error) {

    alert(error.message);
  }
}


// ======================================================
// HACER FUNCIONES ACCESIBLES DESDE EL HTML
// ======================================================

window.abrirEditarSocio = abrirEditarSocio;
window.darDeBaja = darDeBaja;


// ======================================================
// INICIAR
// ======================================================

document.addEventListener(
  "DOMContentLoaded",
  cargarSocios,
);