
# SmartMeal 2.0 🥗

## Práctica Profesionalizante I

**Proyecto:** SmartMeal 2.0  
**Desarrollador:** Laureano Reynoso Ceccarini  
**Carrera:** Desarrollo de Software  
**Año:** Primero  
**Sede:** Rayuela  
**Año de desarrollo:** 2026

---

## 1. Descripción del proyecto

SmartMeal es una aplicación web diseñada para ayudar a las personas a organizar sus alimentos, registrar sus compras y aprovechar mejor los productos disponibles en el hogar.

El proyecto busca facilitar la planificación de comidas, mejorar el control de gastos y contribuir a reducir el desperdicio de alimentos.

En esta segunda versión se incorporó un servidor desarrollado con Python y Flask, una base de datos SQLite y funcionalidades que permiten guardar y consultar información real.

## 2. Problema que busca resolver

Muchas personas realizan compras de alimentos sin llevar un registro de lo que gastan o de los productos que ya tienen disponibles.

Esta situación puede provocar compras innecesarias, dificultades para organizar las comidas y desperdicio de alimentos por fechas de vencimiento.

SmartMeal propone reunir estas herramientas en una aplicación sencilla y accesible.

## 3. Funcionalidades principales

### Voy de compras

- Agregar productos con nombre, cantidad, unidad y precio.
- Calcular automáticamente el total de una compra.
- Seleccionar el comercio.
- Registrar pagos en efectivo, con tarjeta/Mercado Pago o combinados.
- Guardar las compras en SQLite.
- Consultar y eliminar compras anteriores.
- Incorporar productos comprados al inventario.

### Mis alimentos

- Registrar alimentos disponibles en el hogar.
- Clasificarlos por categoría.
- Indicar cantidades y unidades.
- Registrar fechas de vencimiento.
- Identificar productos próximos a vencer o vencidos.
- Buscar y filtrar alimentos.
- Editar y eliminar registros.
- Conservar la información en SQLite.

### Recetas y recomendaciones

- Consultar el catálogo de recetas.
- Obtener sugerencias según los alimentos registrados.
- Visualizar qué ingredientes están disponibles.
- Identificar ingredientes faltantes.
- Priorizar recetas que aprovechan alimentos próximos a vencer.

Las recomendaciones utilizan un sistema de coincidencias y reglas programadas en Python. No dependen de inteligencia artificial generativa ni de servicios externos.

### Inicio de sesión

- Crear una cuenta local.
- Iniciar y cerrar sesión.
- Proteger el acceso a compras e inventario.
- Guardar las contraseñas mediante hashes seguros.

## 4. Tecnologías utilizadas

**Frontend:**
- HTML5
- CSS3
- JavaScript

**Backend:**
- Python
- Flask

**Base de datos:**
- SQLite
- Peewee ORM

**Seguridad:**
- Flask-WTF para protección CSRF
- Flask-Limiter para limitar solicitudes
- Hash de contraseñas con Werkzeug
- Sesiones de Flask
- Encabezados de seguridad HTTP

**Herramientas de desarrollo:**
- Visual Studio Code
- Git
- GitHub
- GitHub Desktop

## 5. Requisitos para ejecutar SmartMeal

Para ejecutar la aplicación en Windows se necesita:

- Una computadora con Windows.
- Python 3 instalado y disponible desde la terminal.
- Conexión a internet durante la primera instalación de dependencias.
- Un navegador web actualizado.

El proyecto fue desarrollado y probado localmente con Python 3.14.5.

No es necesario tener instalado Visual Studio Code para utilizar la aplicación.

## 6. Instalación en Windows

### Paso 1: Descargar el proyecto

Ingresar al repositorio de GitHub:

https://github.com/laurireynoso6-code/SmartMeal/tree/Parcial-2

Seleccionar **Code > Download ZIP**.

Extraer el archivo ZIP en una carpeta de la computadora.

### Paso 2: Instalar Python

Si Python no está instalado, descargarlo desde:

https://www.python.org/downloads/

Comprobar que Python pueda ejecutarse desde la terminal.

### Paso 3: Iniciar SmartMeal

Abrir la carpeta extraída y ejecutar con doble clic:

`iniciar_smartmeal.bat`

El programa preparará automáticamente el entorno virtual, instalará las dependencias y comprobará la base de datos.

Durante la primera ejecución solicitará crear una cuenta de usuario si todavía no existe ninguna.

### Paso 4: Abrir la aplicación

Con la ventana del servidor abierta, ingresar en el navegador a:

http://127.0.0.1:5000/

Para acceder a las funciones privadas, iniciar sesión con la cuenta creada.

**Importante:** mantener abierta la ventana del servidor mientras se utiliza SmartMeal.

## 7. Ejecución desde la terminal

También es posible iniciar SmartMeal manualmente.

Primero, crear un entorno virtual:

```powershell
py -m venv .venv
```

Instalar las dependencias:

```powershell
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

Crear una cuenta si todavía no existe:

```powershell
.\.venv\Scripts\python.exe crear_usuario.py
```

Iniciar el servidor:

```powershell
.\.venv\Scripts\python.exe app.py
```

Abrir:

http://127.0.0.1:5000/

## 8. Organización del proyecto

```text
SmartMeal/
|
|-- app.py
|-- models.py
|-- seguridad.py
|-- autenticacion.py
|-- control_acceso.py
|-- recomendaciones.py
|-- crear_usuario.py
|-- iniciar_smartmeal.bat
|-- requirements.txt
|-- README.md
|-- index.html
|
|-- pages/
|   |-- recetas.html
|   |-- alimentos.html
|   |-- compras.html
|   |-- planes.html
|   |-- contacto.html
|   |-- login.html
|
|-- css/
|   |-- style.css
|   |-- compras.css
|   |-- recomendaciones.css
|
|-- js/
|   |-- script.js
|   |-- compras.js
|   |-- alimentos.js
|   |-- login.js
|   |-- recomendaciones-ui.js
|
|-- img/
|
|-- datos/
|   |-- smartmeal.db
|   |-- .secret_key
|
|-- .gitignore
```

Los archivos `smartmeal.db` y `.secret_key` se generan localmente y no deben publicarse en GitHub.

## 9. Base de datos

SmartMeal utiliza SQLite como base de datos local.

Las principales tablas son:

- **Usuario:** datos de la cuenta y hash de contraseña.
- **Compra:** información general de cada compra.
- **ProductoCompra:** productos registrados dentro de una compra.
- **Alimento:** alimentos disponibles en el inventario.

La relación entre Compra y ProductoCompra permite que una compra contenga varios productos.

Peewee ORM se utiliza para consultar y modificar la información de estas tablas desde Python.

## 10. Endpoints principales

| Método | Endpoint | Función |
|---|---|---|
| GET | /api/estado | Comprobar el servidor |
| GET | /api/sesion | Consultar la sesión |
| POST | /api/login | Iniciar sesión |
| POST | /api/logout | Cerrar sesión |
| GET | /api/compras | Consultar compras |
| POST | /api/compras | Guardar una compra |
| DELETE | /api/compras/{id} | Eliminar una compra |
| GET | /api/alimentos | Consultar inventario |
| POST | /api/alimentos | Agregar alimento |
| PUT | /api/alimentos/{id} | Editar alimento |
| DELETE | /api/alimentos/{id} | Eliminar alimento |
| GET | /api/recomendaciones | Obtener sugerencias |

Las operaciones privadas requieren una sesión iniciada.

## 11. Medidas de seguridad

SmartMeal incorpora las siguientes medidas de seguridad:

- Contraseñas almacenadas mediante hashes.
- Sesiones para identificar usuarios.
- Restricción del acceso a las páginas y API privadas.
- Protección CSRF con Flask-WTF.
- Límites de solicitudes mediante Flask-Limiter.
- Política de seguridad de contenido (CSP).
- Protección contra clickjacking mediante X-Frame-Options.
- Validación de los datos recibidos por Flask.

La aplicación está preparada como proyecto académico para ejecutarse localmente. No se presenta como un servicio público de producción.

## 12. Consideraciones importantes

- La información se guarda en la computadora donde se ejecuta SmartMeal.
- Cada instalación nueva comienza con una base de datos propia.
- No se requiere una conexión permanente a internet para utilizar las funciones locales después de instalar las dependencias, aunque algunos recursos visuales externos pueden necesitarla.
- El servidor Flask utilizado es de desarrollo y está configurado para acceso local.
- GitHub Pages permite publicar contenido estático, pero no ejecuta el servidor Flask ni la base de datos de este proyecto.

## 13. Estado del proyecto

SmartMeal 2.0 cuenta con:

- Interfaz web adaptable.
- Servidor Flask funcional.
- Persistencia con SQLite.
- Compras e inventario conectados.
- Autenticación local.
- Protección de rutas privadas.
- Recomendaciones de recetas según alimentos disponibles.
- Iniciador para Windows.

## 14. Repositorio

Código fuente:

https://github.com/laurireynoso6-code/SmartMeal

---

**SmartMeal 2.0 — Proyecto académico de Desarrollo de Software, 2026.**
