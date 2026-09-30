const API = "http://localhost:3000/api/socios";

// Obtener todos los socios
export async function obtenerSocios() {
  const res = await fetch(API);

  if (!res.ok) {
    throw new Error("Error al obtener los socios");
  }

  return await res.json();
}

// Crear socio
export async function crearSocio(socio) {
  const res = await fetch(API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(socio),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Error al crear el socio");
  }

  return data;
}

// Editar socio
export async function editarSocio(socioId, datos) {
  const res = await fetch(`${API}/${socioId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(datos),
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Error al editar el socio");
  }

  return data;
}

// Dar de baja
export async function darDeBajaSocio(socioId) {
  const res = await fetch(`${API}/${socioId}`, {
    method: "PATCH",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "Error al dar de baja");
  }

  return data;
}