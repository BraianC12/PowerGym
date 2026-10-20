# PowerGym - Sistema de Gestión de Gimnasio

Sistema web integral para la administración de gimnasios, centralización de socios, gestión de membresías y automatización de avisos preventivos de vencimiento.

---

## Contexto del Proyecto

Actualmente muchos gimnasios llevan el control de socios, pagos y asistencia en planillas de cálculo o cuadernos físicos. Cuando un socio consulta cuándo vence su cuota o se necesita saber quiénes están por vencer en la semana, la búsqueda manual genera demoras, desorganización y pérdidas económicas por cuotas no renovadas a tiempo.

**PowerGym** fue desarrollado para el **personal administrativo y profesores del gimnasio** (por ejemplo, el personal de recepción y dueños), permitiéndoles centralizar y gestionar la información operativa y de membresías desde un único lugar, con alertas preventivas para evitar morosidad.

---

## Funcionalidades

1. **Gestión Integral de Socios:**
   - Alta de nuevos socios con validaciones completas (nombre, apellido, email único, teléfono).
   - Modificación de datos personales de socios existentes.
   - Baja lógica y reactivación ágil de socios.
   - Listado con filtros en tiempo real y búsqueda por estado (Activo / Inactivo).

2. **Control de Suscripciones y Vencimientos:**
   - Asignación de planes/membresías y fechas de vigencia.
   - Consulta y seguimiento de socios activos, próximos a vencer y vencidos.
   - Renovación ágil de membresías (+30 días automáticos respetando la fecha previa si está al día, o desde hoy si ya venció, además de fecha personalizada).

3. **Módulo de Avisos Automáticos por Email:**
   - Envío automático de correos electrónicos de aviso $X$ días antes del vencimiento (`AVISOS_DIAS_ANTES`) mediante **Nodemailer** y **SMTP**.
   - Tarea programada en segundo plano con **node-cron** (configurable por zona horaria).
   - Control estricto para evitar duplicados: se envía exactamente un aviso por socio y por ciclo de vencimiento.
   - Panel de control de avisos: visualización de historial de envíos (enviados/fallidos), próximos avisos calculados y disparo manual.

4. **Gestión de Personal y Staff (Entrenadores):**
   - Registro y control del equipo de profesores y administradores.
   - Asignación de roles de sistema.

5. **Autenticación y Seguridad (RBAC):**
   - Inicio de sesión con Email y Contraseña cifrada (`bcryptjs`).
   - Tokens de autorización **JWT** (`jsonwebtoken`) que protegen cada endpoint del backend.
   - Control de acceso por roles en backend y redirecciones automáticas en frontend.

> ⚠️ **Aclaración sobre el alcance:**  
> - El envío de avisos automáticos se realiza exclusivamente por **Email** (no incluye WhatsApp ni SMS).  
> - No incluye facturación electrónica fiscal ni control de stock de mercadería.

---

## Roles de Usuario

| Rol | Permisos y Alcance en el Sistema |
| :--- | :--- |
| **Dueño** *(Administrador General)* | Acceso total: gestión de socios, staff/entrenadores, gestión y renovación de suscripciones, configuración y panel de control de avisos automáticos. |
| **Profesor** *(Entrenador)* | Acceso operativo: consulta y gestión de socios y estado de sus membresías. No tiene acceso a la administración del staff ni al módulo de avisos automáticos. |

---

## Stack Tecnológico y Versiones

### Backend
- **Entorno de ejecución:** [Node.js](https://nodejs.org/) (versión `>= 18.0.0` requerida; recomendada **v20.x LTS**).
- **Framework:** [Express.js](https://expressjs.com/) (`^5.2.1`).
- **Base de Datos & ORM:** [SQLite3](https://www.sqlite.org/) (`^6.0.1`) con [Sequelize](https://sequelize.org/) (`^6.37.8`) (almacenamiento local en archivo `powergym.sqlite`; base en memoria para tests).
- **Autenticación & Criptografía:** `jsonwebtoken` (`^9.0.3`) y `bcryptjs` (`^3.0.3`).
- **Automatización & Cron:** `node-cron` (`^4.6.0`).
- **Envío de Correos:** `nodemailer` (`^10.0.14`).
- **Testing:** Test Runner nativo de Node.js (`node --test`) y `supertest` (`^7.3.0`).

### Frontend
- **Maquetación y Estilos:** HTML5 semántico y CSS3 moderno (arquitectura modular, diseño responsive, temas oscuros y tipografías Oswald y Barlow).
- **Lógica de Cliente:** JavaScript estándar con arquitectura basada en **ES Modules** (`type="module"`, Fetch API nativa y cliente HTTP centralizado).
- **Servidor Web Local:** Live Server (extensión de VS Code) o servidor HTTP estático local (`npx serve` / `npx http-server`).

### Metodología
- **Scrum:** Sprints semanales atados al calendario de clases con seguimiento de backlog en Trello.

---

## Requisitos Previos

Antes de comenzar, asegúrate de tener instalado en tu computadora:

1. **Node.js** (versión `>= 18.0.0` requerida).  
   Puedes verificar tus versiones instaladas ejecutando:
   ```bash
   node -v
   npm -v
   ```
2. **Git** para clonar el repositorio.
3. Un navegador web moderno (Chrome, Firefox, Edge o Safari).
4. **Visual Studio Code** con la extensión **Live Server** (recomendado para el Frontend).

---

## Instalación y Puesta en Marcha

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/PowerGym.git
cd PowerGym
```

---

### 2. Configurar y levantar el Backend

1. **Ingresar a la carpeta `Backend`:**
   ```bash
   cd Backend
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Crear el archivo de variables de entorno `.env`:**
   - En **Windows (PowerShell / CMD)**:
     ```cmd
     copy .env.example .env
     ```
   - En **Linux / macOS / Git Bash**:
     ```bash
     cp .env.example .env
     ```

4. **Configurar el archivo `.env`:**  
   Abre el archivo `.env` generado en el editor y verifica los valores:
   ```env
   PORT=3000
   NODE_ENV=development

   # Clave secreta para la firma de tokens JWT (OBLIGATORIA)
   JWT_SECRET=powergym_secreto_jwt_2026

   # Configuración SMTP (para envío real de correos con Nodemailer)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=tu_correo@gmail.com
   SMTP_PASS=tu_contrasena_de_aplicacion
   SMTP_FROM="PowerGym <tu_correo@gmail.com>"

   # Configuración de avisos automáticos
   AVISOS_DIAS_ANTES=5
   AVISOS_CRON=*/15 8-22 * * *
   AVISOS_TIMEZONE=America/Buenos_Aires
   AVISOS_ACTIVOS=false
   ```
   > 💡 *Nota:* Para probar el sistema de forma local no es indispensable contar con credenciales SMTP reales; las funciones generales del sistema, la base de datos y la suite de pruebas funcionan independientemente.

5. **Cargar los datos iniciales (Semillas / Seed):**  
   Crea las tablas en la base de datos SQLite y genera los usuarios iniciales:
   ```bash
   node seed.js
   ```

   **Usuarios generados por defecto para acceder:**
   | Rol | Email / Usuario | Contraseña |
   | :--- | :--- | :--- |
   | **Dueño** | `dueno@powergym.com` | `clave123` |
   | **Profesor** | `laura@powergym.com` | `clave123` |
   | **Profesor** | `martin@powergym.com` | `clave123` |

6. **Iniciar el servidor Backend:**
   - En modo desarrollo (con reinicio automático al editar código):
     ```bash
     npm run dev
     ```
   - En modo producción / normal:
     ```bash
     node server.js
     ```

   El backend iniciará en:  
   👉 **`http://localhost:3000`**

---

### 3. Levantar la Aplicación Frontend

> ⚠️ **Importante:** Dado que el Frontend utiliza **módulos ES6** de JavaScript (`import`/`export`), no se debe abrir el archivo HTML directamente con doble clic (`file:///`), ya que el navegador bloqueará las solicitudes por políticas de seguridad (CORS). Es necesario usar un servidor local.

#### Opción A: Mediante Visual Studio Code (Live Server) — *Recomendada*
1. Abre la carpeta del proyecto en VS Code.
2. Haz clic derecho sobre el archivo `Frontend/Index.html` (o `Frontend/pages/Acceder.html`).
3. Elige la opción **"Open with Live Server"**.
4. Se abrirá automáticamente tu navegador en `http://127.0.0.1:5500/Frontend/Index.html`.

#### Opción B: Mediante Node.js CLI (`serve` o `http-server`)
Desde la raíz del proyecto ejecuta:
```bash
npx serve Frontend -p 5500
```
Y abre en tu navegador: `http://localhost:5500`.

---

## Pruebas Automatizadas

El proyecto incluye una completa batería de **57 pruebas automatizadas** desarrolladas con el runner nativo de Node.js (`node --test`) y `supertest`, utilizando una base de datos SQLite en memoria para no alterar los datos locales.

Las pruebas cubren:
- **Avisos Automáticos (`avisos.test.js` & `avisosApi.test.js`):** cálculo de fechas según zona horaria argentina, no duplicidad de notificaciones, exclusión de socios inactivos o suscripciones canceladas, permisos por rol y códigos HTTP de la API.
- **Socios (`socios.test.js`):** validación de nombres, apellidos, emails duplicados, teléfonos, bajas lógicas y reactivación.
- **Suscripciones (`suscripciones.test.js`):** renovación sumando 30 días acumulativos en socios vigentes o 30 días a partir de hoy para socios vencidos, fechas personalizadas y control de fechas inválidas.

Para ejecutar la suite de pruebas:

```bash
cd Backend
npm test
```

---

## Estructura del Repositorio

```text
PowerGym/
├── Backend/
│   ├── config/              # Conexión a la base de datos (Sequelize + SQLite)
│   ├── controllers/         # Lógica de controladores (auth, socios, staff, avisos, suscripciones)
│   ├── middlewares/         # Middlewares de autenticación (JWT) y autorización por roles
│   ├── models/              # Modelos de Sequelize (Persona, Socio, Administrador, Suscripcion, Notificacion)
│   ├── routes/              # Rutas de la API REST
│   ├── scripts/             # Scripts de prueba y simulación de escenarios
│   ├── services/            # Servicios de negocio (cálculo de avisos, envío de correos)
│   ├── tareas/              # Cron jobs para avisos automáticos
│   ├── tests/               # Pruebas automatizadas (57 tests)
│   ├── .env.example         # Ejemplo de variables de entorno
│   ├── package.json         # Dependencias y scripts de ejecución
│   ├── seed.js              # Carga de datos semilla (usuarios iniciales)
│   └── server.js            # Inicialización del servidor Express
│
├── Frontend/
│   ├── css/                 # Estilos modulares (main.css, landing, admin, etc.)
│   ├── img/                 # Recursos gráficos e imágenes
│   ├── js/
│   │   ├── api/             # Capa de comunicación con backend (fetch, tokens, endpoints)
│   │   ├── components/      # Helpers y componentes de DOM
│   │   └── views/           # Controladores de vistas (login, socios, dashboard, etc.)
│   ├── pages/
│   │   ├── Acceder.html     # Página de inicio de sesión
│   │   ├── administrador/   # Panel de control de Dueño (Socios, Entrenadores, Suscripciones, Avisos)
│   │   └── entrenador/      # Panel de control de Profesor
│   └── Index.html           # Landing page del gimnasio
│
├── Diagramas/               # Diagramas de arquitectura y modelado
└── README.md                # Documentación del proyecto
```

---

## Equipo de Desarrollo
Proyecto desarrollado en el marco de la cátedra de Ingeniería de Software / Programación Web siguiendo metodología ágil Scrum.
Integrantes:
- Alfonso Jesica
- Iglesias Julian
- Carranza Braian

Informe del Proyecto: https://docs.google.com/document/d/1VB1gV0hnlVdUov0kyB4soOqELHRZfQyNSsVr4CSZoSQ/edit?tab=t.0
