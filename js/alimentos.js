
/* ==================================================
   SMARTMEAL 2.0
   INVENTARIO DE ALIMENTOS
   Practica Profesionalizante I
================================================== */

// ==========================================
// ELEMENTOS DEL HTML
// ==========================================

const formAlimento = document.querySelector("#form-alimento");

const campoId = document.querySelector("#alimento-id");
const campoNombre = document.querySelector("#alimento-nombre");
const campoCategoria = document.querySelector("#alimento-categoria");
const campoCantidad = document.querySelector("#alimento-cantidad");
const campoUnidad = document.querySelector("#alimento-unidad");
const campoVencimiento = document.querySelector("#alimento-vencimiento");

const listaAlimentos = document.querySelector("#lista-alimentos");

const buscarAlimento = document.querySelector("#buscar-alimento");
const filtrarCategoria = document.querySelector("#filtrar-categoria");

const totalAlimentos = document.querySelector("#total-alimentos");
const totalPorVencer = document.querySelector("#total-por-vencer");
const totalVencidos = document.querySelector("#total-vencidos");

const mensajeAlimento = document.querySelector("#mensaje-alimento");
const mensajeInventario = document.querySelector("#mensaje-inventario");

const tituloFormulario = document.querySelector("#titulo-form-alimento");

const botonGuardar = document.querySelector("#boton-guardar-alimento");
const botonCancelar = document.querySelector("#boton-cancelar-edicion");

// Lista de alimentos recuperados desde SQLite
let alimentos = [];

// Evita enviar varias solicitudes simultáneas
let guardando = false;


// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

function crearElemento(etiqueta, clase = "", contenido = "") {

    const elemento = document.createElement(etiqueta);

    if (clase) {
        elemento.className = clase;
    }

    elemento.textContent = contenido;

    return elemento;
}


function mostrarMensaje(elemento, texto, tipo = "") {

    elemento.textContent = texto;
    elemento.className = "compras-mensaje " + tipo;

}


function formatearNumero(numero) {

    return new Intl.NumberFormat("es-AR", {
        maximumFractionDigits: 2
    }).format(Number(numero));

}


function cambiarTextoBoton(texto) {

    const icono = crearElemento(
        "i",
        "bi bi-check-circle-fill"
    );

    botonGuardar.replaceChildren(
        icono,
        document.createTextNode(" " + texto)
    );

}


// ==========================================
// CONTROLAR VENCIMIENTOS
// ==========================================

function calcularDiasRestantes(fechaTexto) {

    if (!fechaTexto) {
        return null;
    }

    const partes = fechaTexto.split("-").map(Number);

    if (partes.length !== 3) {
        return null;
    }

    const fechaVencimiento = Date.UTC(
        partes[0],
        partes[1] - 1,
        partes[2]
    );

    const ahora = new Date();

    const fechaActual = Date.UTC(
        ahora.getFullYear(),
        ahora.getMonth(),
        ahora.getDate()
    );

    return Math.round(
        (fechaVencimiento - fechaActual) / 86400000
    );

}


function obtenerEstadoVencimiento(fechaTexto) {

    const dias = calcularDiasRestantes(fechaTexto);

    if (dias === null) {

        return {
            texto: "Sin fecha de vencimiento",
            tipo: "sin-fecha"
        };

    }

    if (dias < 0) {

        return {
            texto: `Vencido hace ${Math.abs(dias)} día(s)`,
            tipo: "vencido"
        };

    }

    if (dias === 0) {

        return {
            texto: "Vence hoy",
            tipo: "por-vencer"
        };

    }

    if (dias <= 7) {

        return {
            texto: `Vence en ${dias} día(s)`,
            tipo: "por-vencer"
        };

    }

    return {
        texto: "Dentro de la fecha de consumo",
        tipo: "vigente"
    };

}


function formatearFecha(fechaTexto) {

    if (!fechaTexto) {
        return "Sin fecha";
    }

    const partes = fechaTexto.split("-");

    return `${partes[2]}/${partes[1]}/${partes[0]}`;

}


// ==========================================
// ACTUALIZAR RESUMEN
// ==========================================

function actualizarResumen() {

    totalAlimentos.textContent = alimentos.length;

    let proximos = 0;
    let vencidos = 0;

    alimentos.forEach(alimento => {

        const estado = obtenerEstadoVencimiento(
            alimento.fecha_vencimiento
        );

        if (estado.tipo === "por-vencer") {
            proximos++;
        }

        if (estado.tipo === "vencido") {
            vencidos++;
        }

    });

    totalPorVencer.textContent = proximos;
    totalVencidos.textContent = vencidos;

}


// ==========================================
// MOSTRAR INVENTARIO
// ==========================================

function mostrarAlimentos() {

    listaAlimentos.replaceChildren();

    const busqueda = buscarAlimento.value
        .trim()
        .toLowerCase();

    const categoria = filtrarCategoria.value;

    const filtrados = alimentos.filter(alimento => {

        const coincideNombre = alimento.nombre
            .toLowerCase()
            .includes(busqueda);

        const coincideCategoria =
            categoria === "Todas" ||
            alimento.categoria === categoria;

        return coincideNombre && coincideCategoria;

    });

    if (filtrados.length === 0) {

        const aviso = crearElemento(
            "p",
            "compras-vacio",
            alimentos.length === 0
                ? "Todavía no registraste alimentos."
                : "No encontramos alimentos con esos filtros."
        );

        listaAlimentos.appendChild(aviso);

        actualizarResumen();
        return;

    }

    filtrados.forEach(alimento => {

        // TARJETA PRINCIPAL

        const tarjeta = crearElemento(
            "article",
            "historial-tarjeta"
        );

        // ENCABEZADO

        const encabezado = crearElemento(
            "div",
            "historial-encabezado"
        );

        const informacion = crearElemento("div");

        const nombre = crearElemento(
            "h3",
            "",
            alimento.nombre
        );

        const categoriaTexto = crearElemento(
            "p",
            "",
            alimento.categoria
        );

        informacion.append(nombre, categoriaTexto);

        const cantidad = crearElemento(
            "strong",
            "historial-total",
            `${formatearNumero(alimento.cantidad)} ${alimento.unidad}`
        );

        encabezado.append(informacion, cantidad);

        // CUERPO

        const cuerpo = crearElemento(
            "div",
            "historial-cuerpo"
        );

        const detalles = crearElemento(
            "div",
            "historial-detalles"
        );

        const vencimiento = crearElemento(
            "span",
            "",
            "Vencimiento: " +
            formatearFecha(alimento.fecha_vencimiento)
        );

        detalles.appendChild(vencimiento);

        const estado = obtenerEstadoVencimiento(
            alimento.fecha_vencimiento
        );

        const avisoEstado = crearElemento(
            "p",
            "",
            estado.texto
        );

        avisoEstado.style.fontWeight = "700";
        avisoEstado.style.fontSize = "14px";

        if (estado.tipo === "vencido") {
            avisoEstado.style.color = "#bb4545";
        } else if (estado.tipo === "por-vencer") {
            avisoEstado.style.color = "#a46b00";
        } else if (estado.tipo === "vigente") {
            avisoEstado.style.color = "#2e7d32";
        } else {
            avisoEstado.style.color = "#777777";
        }

        cuerpo.append(detalles, avisoEstado);

        // BOTONES DE EDICION Y ELIMINACION

        const acciones = crearElemento(
            "div",
            "historial-acciones"
        );

        acciones.style.gap = "10px";
        acciones.style.flexWrap = "wrap";

        const editar = crearElemento(
            "button",
            "boton boton-principal",
            "Editar"
        );

        editar.type = "button";
        editar.dataset.accion = "editar";
        editar.dataset.id = alimento.id;

        const eliminar = crearElemento(
            "button",
            "historial-eliminar",
            "Eliminar"
        );

        eliminar.type = "button";
        eliminar.dataset.accion = "eliminar";
        eliminar.dataset.id = alimento.id;

        acciones.append(editar, eliminar);

        tarjeta.append(encabezado, cuerpo, acciones);

        listaAlimentos.appendChild(tarjeta);

    });

    actualizarResumen();

}


// ==========================================
// CONSULTAR ALIMENTOS EN FLASK
// ==========================================

async function cargarAlimentos() {

    try {

        const respuesta = await fetch("/api/alimentos");

        if (!respuesta.ok) {
            throw new Error(
                "No se pudo consultar el inventario."
            );
        }

        const resultado = await respuesta.json();

        if (!Array.isArray(resultado)) {
            throw new Error(
                "El servidor devolvió datos incorrectos."
            );
        }

        alimentos = resultado;

        mostrarAlimentos();

        mostrarMensaje(mensajeInventario, "");

    } catch (error) {

        mostrarMensaje(
            mensajeInventario,
            error.message,
            "error"
        );

        listaAlimentos.replaceChildren(
            crearElemento(
                "p",
                "compras-vacio",
                "No pudimos cargar el inventario."
            )
        );

    }

}


// ==========================================
// LIMPIAR FORMULARIO
// ==========================================

function limpiarFormulario() {

    formAlimento.reset();

    campoId.value = "";

    tituloFormulario.textContent = "Agregar alimento";

    cambiarTextoBoton("Guardar alimento");

    botonCancelar.hidden = true;
    botonCancelar.style.display = "none";

}


// ==========================================
// REGISTRAR O EDITAR ALIMENTO
// ==========================================

formAlimento.addEventListener("submit", async function (evento) {

    evento.preventDefault();

    if (guardando || !formAlimento.reportValidity()) {
        return;
    }

    const nombre = campoNombre.value.trim();
    const categoria = campoCategoria.value;
    const cantidad = Number(campoCantidad.value);
    const unidad = campoUnidad.value;
    const fechaVencimiento = campoVencimiento.value || null;

    if (
        !nombre ||
        !Number.isFinite(cantidad) ||
        cantidad <= 0 ||
        cantidad > 9999999999.99
    ) {

        mostrarMensaje(
            mensajeAlimento,
            "Revisá el nombre y la cantidad del alimento.",
            "error"
        );

        return;

    }

    const datos = {
        nombre: nombre,
        categoria: categoria,
        cantidad: cantidad,
        unidad: unidad,
        fecha_vencimiento: fechaVencimiento
    };

    const id = campoId.value;

    const editando = id !== "";

    const direccion = editando
        ? `/api/alimentos/${id}`
        : "/api/alimentos";

    const metodo = editando ? "PUT" : "POST";

    guardando = true;
    botonGuardar.disabled = true;

    mostrarMensaje(
        mensajeAlimento,
        "Guardando alimento..."
    );

    try {

        const respuesta = await fetch(direccion, {

            method: metodo,

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(datos)

        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.error ||
                "No se pudo guardar el alimento."
            );
        }

        limpiarFormulario();

        await cargarAlimentos();

        mostrarMensaje(
            mensajeAlimento,
            editando
                ? "Alimento actualizado correctamente."
                : "Alimento guardado correctamente.",
            "exito"
        );

    } catch (error) {

        mostrarMensaje(
            mensajeAlimento,
            error.message,
            "error"
        );

    } finally {

        guardando = false;
        botonGuardar.disabled = false;

    }

});


// ==========================================
// PREPARAR EDICION
// ==========================================

function prepararEdicion(id) {

    const alimento = alimentos.find(
        elemento => elemento.id === id
    );

    if (!alimento) {
        return;
    }

    campoId.value = alimento.id;
    campoNombre.value = alimento.nombre;
    campoCategoria.value = alimento.categoria;
    campoCantidad.value = alimento.cantidad;
    campoUnidad.value = alimento.unidad;

    campoVencimiento.value =
        alimento.fecha_vencimiento || "";

    tituloFormulario.textContent = "Editar alimento";

    cambiarTextoBoton("Actualizar alimento");

    botonCancelar.hidden = false;
    botonCancelar.style.display = "inline-flex";

    mostrarMensaje(mensajeAlimento, "");

    formAlimento.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });

    campoNombre.focus({
        preventScroll: true
    });

}


// ==========================================
// ELIMINAR ALIMENTO
// ==========================================

async function eliminarAlimento(id) {

    const alimento = alimentos.find(
        elemento => elemento.id === id
    );

    if (!alimento) {
        return;
    }

    const confirmado = confirm(
        `¿Querés eliminar "${alimento.nombre}" del inventario?`
    );

    if (!confirmado) {
        return;
    }

    try {

        const respuesta = await fetch(
            `/api/alimentos/${id}`,
            {
                method: "DELETE"
            }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.error ||
                "No se pudo eliminar el alimento."
            );
        }

        // Si estabamos editando el alimento eliminado
        if (campoId.value === String(id)) {
            limpiarFormulario();
        }

        await cargarAlimentos();

        mostrarMensaje(
            mensajeInventario,
            "Alimento eliminado correctamente.",
            "exito"
        );

    } catch (error) {

        mostrarMensaje(
            mensajeInventario,
            error.message,
            "error"
        );

    }

}


// ==========================================
// BOTONES DEL INVENTARIO
// ==========================================

listaAlimentos.addEventListener("click", function (evento) {

    const boton = evento.target.closest(
        "button[data-accion]"
    );

    if (!boton) {
        return;
    }

    const id = Number(boton.dataset.id);
    const accion = boton.dataset.accion;

    if (accion === "editar") {
        prepararEdicion(id);
    }

    if (accion === "eliminar") {
        eliminarAlimento(id);
    }

});


// ==========================================
// CANCELAR EDICION
// ==========================================

botonCancelar.addEventListener("click", function () {

    limpiarFormulario();

    mostrarMensaje(
        mensajeAlimento,
        "Edición cancelada."
    );

});


// ==========================================
// BUSCADOR Y FILTROS
// ==========================================

buscarAlimento.addEventListener(
    "input",
    mostrarAlimentos
);

filtrarCategoria.addEventListener(
    "change",
    mostrarAlimentos
);


// ==========================================
// INICIALIZACION
// ==========================================

botonCancelar.style.display = "none";

// Consultar los datos al abrir la pagina
cargarAlimentos();
