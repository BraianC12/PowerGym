// ==========================================================
// VIEW / ENTRENADOR
// Panel del entrenador. Lee y escribe socios contra la API
// (mismos datos que el panel de administración). La foto del
// profesor se guarda aparte, recortada a 900px.
// ==========================================================

import { obtenerSocios, crearSocio, editarSocio, darDeBajaSocio } from "../api/sociosApi.js";
import { $, esc } from "../components/dom.js";
import { toast } from "../components/notifications.js";
import { exigirSesion, limpiar, LOGIN_URL } from "../api/sesion.js";

exigirSesion();

const PK = "gym_foto_v1";

const dlg = $("dlg");
const filas = $("rows");
const form = $("form");
const err = $("err");

let socios = [];
let editId = null;

const cerrarSesion = $("cerrarSesion");

if (cerrarSesion) {
  cerrarSesion.addEventListener("click", (e) => {
    e.preventDefault();
    limpiar();
    window.location.replace(LOGIN_URL);
  });
}

// ======================================================
// MAPEO API -> VISTA
// La API devuelve { socioId, estado, Persona: { ... } }.
// La vista trabaja con una forma plana y estados en
// minúsculas para no repetir comparaciones.
// ======================================================

function adaptar(socio) {
  const p = socio.Persona || {};

  const inactivo = /inactiv|baja/i.test(String(socio.estado || ""));

  return {
    id: Number(socio.socioId),
    nombre: p.nombre || "",
    apellido: p.apellido || "",
    tel: p.telefono || "",
    mail: p.email || "",
    estado: inactivo ? "baja" : "activo",
  };
}

// ======================================================
// CARGAR SOCIOS
// ======================================================

async function cargarSocios() {
  try {
    const datos = await obtenerSocios();

    socios = Array.isArray(datos) ? datos.map(adaptar) : [];

    render();

  } catch (e) {
    console.error(e);

    socios = [];

    render();

    toast("No se pudo conectar con la API. Revisá que el servidor esté corriendo.");
  }
}

// ======================================================
// FOTO DEL PROFESOR
// ======================================================

function setPhoto(src) {
  $("img").src = src;
  $("photo").classList.add("has");
}

function initFoto() {
  const imgEl = $("img");

  if (imgEl.getAttribute("src")) {
    setPhoto(imgEl.getAttribute("src"));
  }

  try {
    const p = localStorage.getItem(PK);
    if (p) setPhoto(p);
  } catch (e) {}

  $("pick").onclick = () => $("file").click();

  $("file").onchange = function () {
    const f = this.files && this.files[0];
    if (!f) return;

    const r = new FileReader();

    r.onload = function () {
      const im = new Image();

      im.onload = function () {
        const s = Math.min(1, 900 / Math.max(im.width, im.height));
        const c = document.createElement("canvas");
        c.width = im.width * s;
        c.height = im.height * s;
        c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);

        const url = c.toDataURL("image/png");
        setPhoto(url);

        try {
          localStorage.setItem(PK, url);
        } catch (e) {
          toast("Foto cargada (no se pudo guardar)");
          return;
        }

        toast("Foto actualizada");
      };

      im.src = r.result;
    };

    r.readAsDataURL(f);
  };
}

// ======================================================
// RENDER
// ======================================================

function render() {
  const q = $("q").value.trim().toLowerCase();
  const f = $("f").value;

  const activos = socios.filter((s) => s.estado === "activo").length;
  $("sAct").textContent = activos;
  $("sTot").textContent = socios.length;
  $("sBaja").textContent = socios.length - activos;

  const lista = socios.filter((s) => {
    if (f !== "todos" && s.estado !== f) return false;
    return !q || `${s.nombre} ${s.apellido} ${s.tel}`.toLowerCase().indexOf(q) > -1;
  });

  $("empty").hidden = lista.length > 0;

  filas.innerHTML = lista
    .map((s) => {
      const on = s.estado === "activo";

      return (
        `<tr class="${on ? "" : "baja"}">` +
        `<td><div class="name">${esc(s.nombre)} ${esc(s.apellido)}</div></td>` +
        `<td><div>${esc(s.tel || "—")}</div><div class="dim">${esc(s.mail || "—")}</div></td>` +
        `<td><span class="tag ${on ? "on" : "off"}">${on ? "Activo" : "De baja"}</span></td>` +
        `<td><div class="acts"><button class="btn ghost-btn sm" data-a="edit" data-id="${s.id}">Editar</button>` +
        (on
          ? `<button class="btn danger sm" data-a="baja" data-id="${s.id}">Dar de baja</button>`
          : ``) +
        `</div></td></tr>`
      );
    })
    .join("");
}

// ======================================================
// ALTA / EDICIÓN
// ======================================================

function openForm(s) {
  editId = s ? s.id : null;

  $("dTitle").textContent = s ? "Editar socio" : "Nuevo socio";
  $("nombre").value = s ? s.nombre : "";
  $("apellido").value = s ? s.apellido : "";
  $("tel").value = s ? s.tel : "";
  $("mail").value = s ? s.mail : "";
  err.textContent = "";

  dlg.showModal();
  $("nombre").focus();
}

function initForm() {
  $("nuevo").onclick = $("nuevo2").onclick = () => openForm(null);
  $("cancel").onclick = () => dlg.close();

  $("q").oninput = render;
  $("f").onchange = render;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const n = $("nombre").value.trim();
    const a = $("apellido").value.trim();
    const tel = $("tel").value.trim();
    const mail = $("mail").value.trim();

    if (!n) { err.textContent = "Ingresá el nombre."; return; }
    if (!a) { err.textContent = "Ingresá el apellido."; return; }
    if (tel.replace(/\D/g, "").length < 6) { err.textContent = "Ingresá un teléfono válido."; return; }
    if (!mail) { err.textContent = "Ingresá el email."; return; }
    if (!/^\S+@\S+\.\S+$/.test(mail)) { err.textContent = "El email no tiene un formato válido."; return; }

    const datos = { nombre: n, apellido: a, telefono: tel, email: mail };

    err.textContent = "";

    try {
      if (editId) {
        await editarSocio(editId, datos);

        toast("Socio actualizado");
      } else {
        await crearSocio(datos);

        toast("Socio creado");
      }

      dlg.close();

      await cargarSocios();

    } catch (error) {
      console.error(error);

      err.textContent = error.message;
    }
  });

  filas.addEventListener("click", async (e) => {
    const b = e.target.closest("button");
    if (!b) return;

    const id = +b.dataset.id;
    const s = socios.filter((x) => x.id === id)[0];
    if (!s) return;

    if (b.dataset.a === "edit") openForm(s);

    if (b.dataset.a === "baja" && confirm(`¿Dar de baja a ${s.nombre} ${s.apellido}?`)) {
      try {
        await darDeBajaSocio(id);

        toast("Socio dado de baja");

        await cargarSocios();

      } catch (error) {
        console.error(error);

        toast(error.message);
      }
    }
  });
}

// ======================================================
// INICIAR
// ======================================================

initFoto();
initForm();
render();

document.addEventListener("DOMContentLoaded", cargarSocios);
