
import {
    obtenerEntrenadores,
    crearEntrenador,
    editarEntrenador,
    darDeBajaEntrenador
} from "../api/entrenadoresApi.js";

import { notificacion } from "../components/notifications.js";

import { abrir, cerrar } from "../components/modal.js";


// ==========================
// VARIABLES
// ==========================

let entrenadores = [];
let entrenadorEditando = null;
let entrenadorParaEliminar = null;


// ==========================
// ELEMENTOS DEL HTML
// ==========================

const tabla =
    document.getElementById("tablaEntrenadores");

const buscador =
    document.getElementById("buscarEntrenador");

const btnAgregar =
    document.getElementById("btnAgregarEntrenador");

const modalCrear =
    document.getElementById("modalCrear");

const modalEditar =
    document.getElementById("modalEditar");

const modalConfirmacion =
    document.getElementById("modalConfirmacion");

const cerrarCrear =
    document.getElementById("cerrarCrear");

const cerrarEditar =
    document.getElementById("cerrarEditar");

const formCrear =
    document.getElementById("formCrearEntrenador");

const formEditar =
    document.getElementById("formEditarEntrenador");

const btnCancelarConfirmacion =
    document.getElementById("btnCancelarConfirmacion");

const btnConfirmarBaja =
    document.getElementById("btnConfirmarBaja");
// ==========================
// NOTIFICACIONES
// ==========================

const mostrarNotificacion = notificacion;


// ==========================
// ABRIR MODAL CREAR
// ==========================

btnAgregar.addEventListener("click", () => {

    formCrear.reset();

    abrir(modalCrear);
});


// ==========================
// CERRAR MODAL CREAR
// ==========================

cerrarCrear.addEventListener("click", () => {

    cerrar(modalCrear);
});


// ==========================
// CERRAR MODAL EDITAR
// ==========================

cerrarEditar.addEventListener("click", () => {

    cerrar(modalEditar);
});


// ==========================
// CERRAR MODALES HACIENDO CLICK AFUERA
// ==========================

window.addEventListener("click", (event) => {

    if (event.target === modalCrear) {

        cerrar(modalCrear);
    }

    if (event.target === modalEditar) {

        cerrar(modalEditar);
    }

    if (event.target === modalConfirmacion) {

        cerrar(modalConfirmacion);
    }
});

// ==========================
// VALIDAR DATOS
// ==========================

function validarDatos(datos, esCrear = true) {

    if (!datos.nombre.trim()) {

        mostrarNotificacion(
            "El nombre es obligatorio.",
            "error"
        );

        return false;
    }


    if (!datos.apellido.trim()) {

        mostrarNotificacion(
            "El apellido es obligatorio.",
            "error"
        );

        return false;
    }


    if (!datos.email.trim()) {

        mostrarNotificacion(
            "El correo electrónico es obligatorio.",
            "error"
        );

        return false;
    }


    if (!datos.nombreUsuario.trim()) {

        mostrarNotificacion(
            "El nombre de usuario es obligatorio.",
            "error"
        );

        return false;
    }


    const emailValido =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (!emailValido.test(datos.email)) {

        mostrarNotificacion(
            "Ingresá un correo electrónico válido.",
            "error"
        );

        return false;
    }


    if (
        esCrear &&
        !datos.contrasena.trim()
    ) {

        mostrarNotificacion(
            "La contraseña es obligatoria.",
            "error"
        );

        return false;
    }


    if (
        datos.contrasena &&
        datos.contrasena.length < 6
    ) {

        mostrarNotificacion(
            "La contraseña debe tener al menos 6 caracteres.",
            "error"
        );

        return false;
    }


    return true;
}


// ==========================
// CREAR ENTRENADOR
// ==========================

formCrear.addEventListener("submit", async (event) => {

    event.preventDefault();


    const datos = {

        nombre:
            document.getElementById(
                "crearNombre"
            ).value,

        apellido:
            document.getElementById(
                "crearApellido"
            ).value,

        telefono:
            document.getElementById(
                "crearTelefono"
            ).value,

        email:
            document.getElementById(
                "crearEmail"
            ).value,

        nombreUsuario:
            document.getElementById(
                "crearUsuario"
            ).value,

        contrasena:
            document.getElementById(
                "crearContrasena"
            ).value
    };


    if (!validarDatos(datos, true)) {
        return;
    }


    try {

        await crearEntrenador(datos);


        mostrarNotificacion(
            "Entrenador creado correctamente.",
            "exito"
        );


        cerrar(modalCrear);

        formCrear.reset();


        await cargarEntrenadores();


    } catch (error) {

        console.error(error);

        mostrarNotificacion(
            error.message,
            "error"
        );
    }
});


// ==========================
// MOSTRAR ENTRENADORES
// ==========================

function mostrarEntrenadores(lista) {

    tabla.innerHTML = "";


    if (lista.length === 0) {

        tabla.innerHTML = `
            <tr>
                <td colspan="6">
                    No hay entrenadores registrados.
                </td>
            </tr>
        `;

        return;
    }


    lista.forEach((entrenador) => {

        const persona =
            entrenador.Persona;


        const fila =
            document.createElement("tr");


        fila.innerHTML = `
            <td>
                ${persona.nombre}
                ${persona.apellido}
            </td>

            <td>
                ${persona.telefono || "Sin teléfono"}
            </td>

    

            <td>
                <span
                    class="status ${
                        entrenador.estado === "Activo"
                            ? "active"
                            : "inactive"
                    }"
                >
                    ${entrenador.estado}
                </span>
            </td>

            <td>
${
    entrenador.estado === "Activo"
        ? `
            <button
                class="action-btn"
                onclick="abrirEditar(${entrenador.administradorId})"
            >
                Editar
            </button>

            <button
                class="action-btn delete"
                onclick="darDeBaja(${entrenador.administradorId})"
            >
                Eliminar
            </button>
        `
        : `
            <button
                class="action-btn disabled"
                disabled
            >
                Editar
            </button>

            <button
                class="action-btn disabled"
                disabled
            >
                Eliminado
            </button>
        `
}
            </td>
        `;


        tabla.appendChild(fila);
    });
}


// ==========================
// ABRIR MODAL EDITAR
// ==========================

window.abrirEditar = function(id) {

    const entrenador =
        entrenadores.find(
            entrenador =>
                entrenador.administradorId === id
        );


    if (!entrenador) {
        return;
    }


    entrenadorEditando = id;


    const persona =
        entrenador.Persona;


    document.getElementById(
        "editarNombre"
    ).value =
        persona.nombre;


    document.getElementById(
        "editarApellido"
    ).value =
        persona.apellido;


    document.getElementById(
        "editarTelefono"
    ).value =
        persona.telefono || "";


    document.getElementById(
        "editarEmail"
    ).value =
        persona.email;


    document.getElementById(
        "editarUsuario"
    ).value =
        entrenador.nombreUsuario;


    document.getElementById(
        "editarContrasena"
    ).value = "";


    abrir(modalEditar);
};


// ==========================
// EDITAR ENTRENADOR
// ==========================

formEditar.addEventListener("submit", async (event) => {

    event.preventDefault();


    const datos = {

        nombre:
            document.getElementById(
                "editarNombre"
            ).value,

        apellido:
            document.getElementById(
                "editarApellido"
            ).value,

        telefono:
            document.getElementById(
                "editarTelefono"
            ).value,

        email:
            document.getElementById(
                "editarEmail"
            ).value,

        nombreUsuario:
            document.getElementById(
                "editarUsuario"
            ).value,

        contrasena:
            document.getElementById(
                "editarContrasena"
            ).value
    };


    if (!validarDatos(datos, false)) {
        return;
    }


    try {

        await editarEntrenador(
            entrenadorEditando,
            datos
        );


        mostrarNotificacion(
            "Entrenador actualizado correctamente.",
            "exito"
        );


        cerrar(modalEditar);


        await cargarEntrenadores();


    } catch (error) {

        console.error(error);


        mostrarNotificacion(
            error.message,
            "error"
        );
    }
});


// ==========================
// ABRIR CONFIRMACIÓN DE BAJA
// ==========================

window.darDeBaja = function(id) {

    entrenadorParaEliminar = id;

    abrir(modalConfirmacion);
};


// ==========================
// CANCELAR BAJA
// ==========================

btnCancelarConfirmacion.addEventListener(
    "click",
    () => {

        entrenadorParaEliminar = null;

        cerrar(modalConfirmacion);
    }
);


// ==========================
// CONFIRMAR BAJA
// ==========================

btnConfirmarBaja.addEventListener(
    "click",
    async () => {

        if (!entrenadorParaEliminar) {
            return;
        }


        try {

            await darDeBajaEntrenador(
                entrenadorParaEliminar
            );


            cerrar(modalConfirmacion);


            mostrarNotificacion(
                "Entrenador dado de baja correctamente.",
                "exito"
            );


            entrenadorParaEliminar = null;


            await cargarEntrenadores();


        } catch (error) {

            console.error(error);


            cerrar(modalConfirmacion);


            mostrarNotificacion(
                error.message,
                "error"
            );
        }
    }
);


// ==========================
// CARGAR ENTRENADORES
// ==========================

async function cargarEntrenadores() {

    try {

        const respuesta =
            await obtenerEntrenadores();


        entrenadores =
            respuesta.entrenadores ||
            respuesta;


        mostrarEntrenadores(
            entrenadores
        );


        actualizarResumen(
            entrenadores
        );


    } catch (error) {

        console.error(error);


        tabla.innerHTML = `
            <tr>
                <td colspan="6">
                    Error al cargar los entrenadores.
                </td>
            </tr>
        `;
    }
}


// ==========================
// ACTUALIZAR RESUMEN
// ==========================

function actualizarResumen(lista) {

    document.getElementById(
        "totalEntrenadores"
    ).textContent =
        lista.length;


    const activos =
        lista.filter(
            entrenador =>
                entrenador.estado === "Activo"
        ).length;


    document.getElementById(
        "entrenadoresActivos"
    ).textContent =
        activos;
}


// ==========================
// BUSCADOR
// ==========================

buscador.addEventListener("input", () => {

    const texto =
        buscador.value.toLowerCase();


    const filtrados =
        entrenadores.filter((entrenador) => {

            const persona =
                entrenador.Persona;


            const nombre =
                `${persona.nombre} ${persona.apellido}`
                .toLowerCase();


            return nombre.includes(texto);
        });


    mostrarEntrenadores(
        filtrados
    );
});


// ==========================
// INICIAR
// ==========================

cargarEntrenadores();

