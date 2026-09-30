// ==========================
// URL DE LA API
// ==========================

const API =
    "http://localhost:3000/api/staff";


// ==========================
// OBTENER ENTRENADORES
// ==========================

export async function obtenerEntrenadores() {

    const respuesta =
        await fetch(API);


    if (!respuesta.ok) {

        throw new Error(
            "Error al obtener los entrenadores"
        );

    }


    return await respuesta.json();

}


// ==========================
// CREAR ENTRENADOR
// ==========================

export async function crearEntrenador(datos) {

    const respuesta =
        await fetch(API, {

            method: "POST",

            headers: {
                "Content-Type":
                    "application/json"
            },

            body: JSON.stringify({

                ...datos,

                rol: "Profesor"

            })

        });


    const resultado =
        await respuesta.json();


    if (!respuesta.ok) {

        throw new Error(
            resultado.error ||
            "Error al crear el entrenador"
        );

    }


    return resultado;

}


// ==========================
// EDITAR ENTRENADOR
// ==========================

export async function editarEntrenador(
    id,
    datos
) {

    const respuesta =
        await fetch(
            `${API}/${id}`,
            {

                method: "PUT",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    ...datos,

                    rol: "Profesor"

                })

            }
        );


    const resultado =
        await respuesta.json();


    if (!respuesta.ok) {

        throw new Error(
            resultado.error ||
            "Error al editar el entrenador"
        );

    }


    return resultado;

}


// ==========================
// DAR DE BAJA
// ==========================

export async function darDeBajaEntrenador(
    id
) {

    const respuesta =
        await fetch(
            `${API}/${id}`,
            {

                method: "PATCH"

            }
        );


    const resultado =
        await respuesta.json();


    if (!respuesta.ok) {

        throw new Error(
            resultado.error ||
            "Error al dar de baja al entrenador"
        );

    }


    return resultado;

}