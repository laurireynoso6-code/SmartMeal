
/* ==================================================
   SMARTMEAL 2.0
   COMPRAS E INTEGRACION CON EL INVENTARIO
   Practica Profesionalizante I
================================================== */

// ==========================================
// ELEMENTOS DE LA PAGINA
// ==========================================

const formProducto = document.querySelector("#form-producto");
const formCompra = document.querySelector("#form-compra");

const listaProductos = document.querySelector("#lista-productos");
const totalCompra = document.querySelector("#total-compra");

const campoPago = document.querySelector("#compra-pago");
const campoCombinado = document.querySelector("#campo-pago-combinado");
const montoEfectivo = document.querySelector("#monto-efectivo");

const historialCompras = document.querySelector("#historial-compras");
const mensajeCompra = document.querySelector("#mensaje-compra");
const mensajeHistorial = document.querySelector("#mensaje-historial");
const botonGuardar = document.querySelector("#boton-guardar-compra");

// Productos de la compra actual
let productos = [];

// Historial recibido desde SQLite
let comprasGuardadas = [];

const formatoDinero = new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS"
});


// ==========================================
// FUNCIONES GENERALES
// ==========================================

function dinero(numero) {
    return formatoDinero.format(Number(numero));
}

function redondear(numero) {
    return Math.round((numero + Number.EPSILON) * 100) / 100;
}

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


// ==========================================
// CALCULAR TOTAL
// ==========================================

function calcularTotal() {

    return redondear(
        productos.reduce((total, producto) => {
            return total + (
                producto.cantidad * producto.precio_unitario
            );
        }, 0)
    );

}


// ==========================================
// MOSTRAR PRODUCTOS DE LA COMPRA ACTUAL
// ==========================================

function mostrarProductos() {

    listaProductos.replaceChildren();

    if (productos.length === 0) {

        listaProductos.appendChild(
            crearElemento(
                "p",
                "compras-vacio",
                "Todavía no agregaste productos."
            )
        );

    } else {

        productos.forEach((producto, indice) => {

            const item = crearElemento("div", "compras-item");

            const info = crearElemento(
                "div",
                "compras-item-info"
            );

            const nombre = crearElemento(
                "strong",
                "",
                producto.nombre
            );

            const detalle = crearElemento(
                "span",
                "",
                `${producto.cantidad} ${producto.unidad} × ` +
                dinero(producto.precio_unitario)
            );

            info.append(nombre, detalle);

            const subtotal = crearElemento(
                "strong",
                "compras-item-precio",
                dinero(
                    producto.cantidad * producto.precio_unitario
                )
            );

            const eliminar = crearElemento(
                "button",
                "compras-eliminar",
                "×"
            );

            eliminar.type = "button";
            eliminar.dataset.indice = indice;
            eliminar.setAttribute(
                "aria-label",
                `Quitar ${producto.nombre}`
            );

            item.append(info, subtotal, eliminar);
            listaProductos.appendChild(item);

        });

    }

    totalCompra.textContent = dinero(calcularTotal());

}


// ==========================================
// AGREGAR PRODUCTO A LA COMPRA
// ==========================================

formProducto.addEventListener("submit", function (evento) {

    evento.preventDefault();

    if (!formProducto.reportValidity()) {
        return;
    }

    const nombre = document.querySelector(
        "#producto-nombre"
    ).value.trim();

    const cantidad = Number(
        document.querySelector("#producto-cantidad").value
    );

    const unidad = document.querySelector(
        "#producto-unidad"
    ).value;

    const precio = Number(
        document.querySelector("#producto-precio").value
    );

    if (
        !nombre ||
        !Number.isFinite(cantidad) ||
        !Number.isFinite(precio) ||
        cantidad <= 0 ||
        precio <= 0
    ) {

        mostrarMensaje(
            mensajeCompra,
            "Revisá los datos del producto.",
            "error"
        );
        return;
    }

    if (productos.length >= 50) {

        mostrarMensaje(
            mensajeCompra,
            "Podés agregar hasta 50 productos por compra.",
            "error"
        );
        return;
    }

    if (
        redondear(
            calcularTotal() + cantidad * precio
        ) > 9999999999.99
    ) {

        mostrarMensaje(
            mensajeCompra,
            "El total supera el límite permitido.",
            "error"
        );
        return;
    }

    productos.push({
        nombre: nombre,
        cantidad: cantidad,
        unidad: unidad,
        precio_unitario: precio
    });

    mostrarProductos();
    mostrarMensaje(mensajeCompra, "");

    formProducto.reset();

    document.querySelector("#producto-nombre").focus();

});


// ==========================================
// QUITAR PRODUCTO DE LA COMPRA
// ==========================================

listaProductos.addEventListener("click", function (evento) {

    const boton = evento.target.closest("[data-indice]");

    if (!boton) {
        return;
    }

    const indice = Number(boton.dataset.indice);

    productos.splice(indice, 1);
    mostrarProductos();

});


// ==========================================
// MEDIO DE PAGO
// ==========================================

campoPago.addEventListener("change", function () {

    const combinado = campoPago.value === "Combinado";

    campoCombinado.hidden = !combinado;
    montoEfectivo.required = combinado;
    montoEfectivo.disabled = !combinado;

    if (!combinado) {
        montoEfectivo.value = "";
    }

});


// ==========================================
// GUARDAR COMPRA EN SQLITE
// ==========================================

formCompra.addEventListener("submit", async function (evento) {

    evento.preventDefault();

    if (productos.length === 0) {

        mostrarMensaje(
            mensajeCompra,
            "Primero agregá al menos un producto.",
            "error"
        );
        return;
    }

    if (!formCompra.reportValidity()) {
        return;
    }

    const comercio = document.querySelector(
        "#compra-comercio"
    ).value;

    const modoPago = campoPago.value;

    if (modoPago === "Combinado") {

        const efectivo = Number(montoEfectivo.value);

        if (
            !Number.isFinite(efectivo) ||
            efectivo <= 0 ||
            efectivo >= calcularTotal()
        ) {

            mostrarMensaje(
                mensajeCompra,
                "El monto en efectivo debe ser mayor que cero " +
                "y menor al total.",
                "error"
            );
            return;
        }

    }

    const datos = {
        comercio: comercio,
        modo_pago: modoPago,
        monto_efectivo: modoPago === "Combinado"
            ? montoEfectivo.value
            : "0",
        productos: productos
    };

    botonGuardar.disabled = true;

    mostrarMensaje(mensajeCompra, "Guardando compra...");

    try {

        const respuesta = await fetchSeguro("/api/compras", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(datos)
        });

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.error || "No se pudo guardar."
            );
        }

        productos = [];
        mostrarProductos();

        formProducto.reset();
        formCompra.reset();

        campoCombinado.hidden = true;
        montoEfectivo.required = false;
        montoEfectivo.disabled = true;

        mostrarMensaje(
            mensajeCompra,
            `¡Compra #${resultado.compra_id} guardada!`,
            "exito"
        );

        await cargarHistorial();

    } catch (error) {

        mostrarMensaje(
            mensajeCompra,
            error.message,
            "error"
        );

    } finally {

        botonGuardar.disabled = false;

    }

});


// ==========================================
// CONSULTAR HISTORIAL
// ==========================================

async function cargarHistorial() {

    try {

        const respuesta = await fetchSeguro("/api/compras");

        if (!respuesta.ok) {
            throw new Error("No se pudo cargar el historial.");
        }

        const resultado = await respuesta.json();

        if (!Array.isArray(resultado)) {
            throw new Error("El historial tiene un formato incorrecto.");
        }

        comprasGuardadas = resultado;

        mostrarHistorial();

        mostrarMensaje(mensajeHistorial, "");

    } catch (error) {

        mostrarMensaje(
            mensajeHistorial,
            error.message,
            "error"
        );

    }

}


// ==========================================
// MOSTRAR COMPRAS ANTERIORES
// ==========================================

function mostrarHistorial() {

    historialCompras.replaceChildren();

    if (comprasGuardadas.length === 0) {

        historialCompras.appendChild(
            crearElemento(
                "p",
                "compras-vacio",
                "Todavía no hay compras registradas."
            )
        );

        return;
    }

    comprasGuardadas.forEach(compra => {

        const tarjeta = crearElemento(
            "article",
            "historial-tarjeta"
        );

        // ENCABEZADO

        const encabezado = crearElemento(
            "div",
            "historial-encabezado"
        );

        const info = crearElemento("div");

        const titulo = crearElemento(
            "h3",
            "",
            `Compra #${compra.id}`
        );

        const fechaCompra = new Date(compra.fecha);

        const fecha = crearElemento(
            "p",
            "",
            Number.isNaN(fechaCompra.getTime())
                ? "Fecha no disponible"
                : fechaCompra.toLocaleString("es-AR")
        );

        info.append(titulo, fecha);

        const total = crearElemento(
            "strong",
            "historial-total",
            dinero(compra.total)
        );

        encabezado.append(info, total);

        // DETALLES

        const cuerpo = crearElemento(
            "div",
            "historial-cuerpo"
        );

        const detalles = crearElemento(
            "div",
            "historial-detalles"
        );

        detalles.append(
            crearElemento(
                "span",
                "",
                `Comercio: ${compra.comercio}`
            ),
            crearElemento(
                "span",
                "",
                `Pago: ${compra.modo_pago}`
            )
        );

        if (compra.modo_pago === "Combinado") {

            detalles.appendChild(
                crearElemento(
                    "span",
                    "",
                    `Efectivo: ${dinero(compra.monto_efectivo)}`
                )
            );

        }

        // PRODUCTOS CON BOTON DE INVENTARIO

        const lista = crearElemento(
            "ul",
            "historial-productos"
        );

        compra.productos.forEach(producto => {

            const fila = crearElemento("li");

            const nombre = crearElemento(
                "span",
                "",
                `${producto.nombre} — ` +
                `${producto.cantidad} ${producto.unidad}`
            );

            const accionesProducto = crearElemento("div");

            accionesProducto.style.display = "flex";
            accionesProducto.style.alignItems = "center";
            accionesProducto.style.gap = "12px";
            accionesProducto.style.flexWrap = "wrap";

            const importe = crearElemento(
                "strong",
                "",
                dinero(
                    Number(producto.cantidad) *
                    Number(producto.precio_unitario)
                )
            );

            const importar = crearElemento(
                "button",
                "boton boton-principal",
                "Al inventario"
            );

            importar.type = "button";
            importar.dataset.importarProducto = producto.id;
            importar.dataset.compraId = compra.id;
            importar.style.padding = "8px 12px";
            importar.style.fontSize = "12px";

            importar.setAttribute(
                "aria-label",
                `Agregar ${producto.nombre} al inventario`
            );

            accionesProducto.append(importe, importar);
            fila.append(nombre, accionesProducto);

            lista.appendChild(fila);

        });

        const mensajeImportacion = crearElemento(
            "p",
            "compras-mensaje"
        );

        mensajeImportacion.dataset.mensajeImportacion = "";
        mensajeImportacion.setAttribute("role", "status");

        cuerpo.append(
            detalles,
            lista,
            mensajeImportacion
        );

        // ELIMINAR COMPRA

        const acciones = crearElemento(
            "div",
            "historial-acciones"
        );

        const eliminar = crearElemento(
            "button",
            "historial-eliminar",
            "Eliminar compra"
        );

        eliminar.type = "button";
        eliminar.dataset.idCompra = compra.id;

        acciones.appendChild(eliminar);

        tarjeta.append(encabezado, cuerpo, acciones);

        historialCompras.appendChild(tarjeta);

    });

}


// ==========================================
// FORMULARIO PARA PASAR AL INVENTARIO
// ==========================================

function abrirFormularioInventario(compraId, productoId) {

    const compra = comprasGuardadas.find(
        elemento => elemento.id === compraId
    );

    if (!compra) {
        return;
    }

    const producto = compra.productos.find(
        elemento => elemento.id === productoId
    );

    if (!producto) {
        return;
    }

    // Cerrar otros formularios abiertos

    document.querySelectorAll(
        ".importacion-formulario"
    ).forEach(formulario => formulario.remove());

    const botonOrigen = historialCompras.querySelector(
        `[data-importar-producto="${productoId}"]`
    );

    if (!botonOrigen) {
        return;
    }

    const tarjeta = botonOrigen.closest(
        ".historial-tarjeta"
    );

    const cuerpo = tarjeta.querySelector(
        ".historial-cuerpo"
    );

    const mensaje = cuerpo.querySelector(
        "[data-mensaje-importacion]"
    );

    mostrarMensaje(mensaje, "");

    // FORMULARIO

    const formulario = crearElemento(
        "form",
        "compras-panel importacion-formulario"
    );

    formulario.style.marginTop = "20px";

    const titulo = crearElemento(
        "h3",
        "",
        `Agregar "${producto.nombre}" a Mis alimentos`
    );

    const explicacion = crearElemento(
        "p",
        "",
        `Cantidad: ${producto.cantidad} ${producto.unidad}. ` +
        "Elegí la categoría y, si corresponde, el vencimiento."
    );

    explicacion.style.margin = "12px 0";
    explicacion.style.fontSize = "13px";

    // CATEGORIA

    const campoCategoria = crearElemento(
        "div",
        "compras-campo"
    );

    const etiquetaCategoria = crearElemento(
        "label",
        "",
        "Categoría"
    );

    etiquetaCategoria.htmlFor = `categoria-importar-${productoId}`;

    const selector = crearElemento("select");

    selector.id = `categoria-importar-${productoId}`;
    selector.required = true;

    const categorias = [
        ["", "Seleccioná una categoría"],
        ["Frutas", "Frutas"],
        ["Verduras", "Verduras"],
        ["Lácteos", "Lácteos"],
        ["Proteínas", "Proteínas"],
        ["Otros", "Otros"]
    ];

    categorias.forEach(([valor, texto]) => {

        const opcion = document.createElement("option");
        opcion.value = valor;
        opcion.textContent = texto;

        selector.appendChild(opcion);

    });

    campoCategoria.append(
        etiquetaCategoria,
        selector
    );

    // VENCIMIENTO

    const campoFecha = crearElemento(
        "div",
        "compras-campo"
    );

    const etiquetaFecha = crearElemento(
        "label",
        "",
        "Fecha de vencimiento (opcional)"
    );

    etiquetaFecha.htmlFor = `fecha-importar-${productoId}`;

    const fecha = document.createElement("input");

    fecha.type = "date";
    fecha.id = `fecha-importar-${productoId}`;

    campoFecha.append(etiquetaFecha, fecha);

    // BOTONES

    const botones = crearElemento(
        "div",
        "historial-acciones"
    );

    botones.style.padding = "18px 0 0";
    botones.style.gap = "12px";
    botones.style.flexWrap = "wrap";

    const cancelar = crearElemento(
        "button",
        "historial-eliminar",
        "Cancelar"
    );

    cancelar.type = "button";

    cancelar.addEventListener("click", () => {
        formulario.remove();
    });

    const guardar = crearElemento(
        "button",
        "boton boton-principal",
        "Guardar en inventario"
    );

    guardar.type = "submit";

    botones.append(cancelar, guardar);

    formulario.append(
        titulo,
        explicacion,
        campoCategoria,
        campoFecha,
        botones
    );

    cuerpo.appendChild(formulario);

    selector.focus();

    // GUARDAR ALIMENTO

    formulario.addEventListener("submit", async evento => {

        evento.preventDefault();

        if (!formulario.reportValidity()) {
            return;
        }

        guardar.disabled = true;

        mostrarMensaje(
            mensaje,
            "Agregando alimento al inventario..."
        );

        try {

            const datos = {
                nombre: producto.nombre,
                categoria: selector.value,
                cantidad: producto.cantidad,
                unidad: producto.unidad,
                fecha_vencimiento: fecha.value || null
            };

            // Consultar si el mismo alimento ya existe
            const respuestaInventario = await fetchSeguro(
                "/api/alimentos"
            );

            if (!respuestaInventario.ok) {
                throw new Error(
                    "No se pudo consultar el inventario."
                );
            }

            const inventario = await respuestaInventario.json();

            // Coincide nombre, categoria, unidad y vencimiento
            const existente = inventario.find(alimento => {

                return (
                    alimento.nombre.trim().toLowerCase() ===
                        producto.nombre.trim().toLowerCase() &&
                    alimento.categoria === selector.value &&
                    alimento.unidad === producto.unidad &&
                    (alimento.fecha_vencimiento || null) ===
                        (fecha.value || null)
                );

            });

            let direccion = "/api/alimentos";
            let metodo = "POST";
            let mensajeExito = "¡Producto agregado al inventario!";

            if (existente) {

                const sumar = confirm(
                    `"${producto.nombre}" ya existe en tu inventario ` +
                    "con la misma categoría, unidad y vencimiento.\n\n" +
                    `¿Querés sumar ${producto.cantidad} ${producto.unidad} ` +
                    "a la cantidad actual?"
                );

                if (!sumar) {

                    mostrarMensaje(
                        mensaje,
                        "No se realizaron cambios."
                    );

                    return;
                }

                const nuevaCantidad =
                    Number(existente.cantidad) +
                    Number(producto.cantidad);

                if (
                    !Number.isFinite(nuevaCantidad) ||
                    nuevaCantidad > 9999999999.99
                ) {
                    throw new Error(
                        "La cantidad supera el límite permitido."
                    );
                }

                datos.cantidad = nuevaCantidad.toFixed(2);

                direccion = `/api/alimentos/${existente.id}`;
                metodo = "PUT";

                mensajeExito =
                    "¡Cantidad sumada al alimento existente!";

            }

            const respuesta = await fetchSeguro(direccion, {

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
                    "No se pudo actualizar el inventario."
                );
            }

            formulario.remove();

            mostrarMensaje(
                mensaje,
                mensajeExito +
                " Ya podés verlo en Mis alimentos.",
                "exito"
            );

        } catch (error) {

            mostrarMensaje(
                mensaje,
                error.message,
                "error"
            );

        } finally {

            guardar.disabled = false;

        }

    });

}


// ==========================================
// ELIMINAR UNA COMPRA
// ==========================================

async function eliminarCompra(id, boton) {

    const confirmar = window.confirm(
        `¿Querés eliminar la compra #${id}?`
    );

    if (!confirmar) {
        return;
    }

    boton.disabled = true;

    try {

        const respuesta = await fetchSeguro(
            `/api/compras/${id}`,
            {
                method: "DELETE"
            }
        );

        const resultado = await respuesta.json();

        if (!respuesta.ok) {
            throw new Error(
                resultado.error ||
                "No se pudo eliminar la compra."
            );
        }

        await cargarHistorial();

        mostrarMensaje(
            mensajeHistorial,
            "Compra eliminada correctamente.",
            "exito"
        );

    } catch (error) {

        mostrarMensaje(
            mensajeHistorial,
            error.message,
            "error"
        );

        boton.disabled = false;

    }

}


// ==========================================
// EVENTOS DEL HISTORIAL
// ==========================================

historialCompras.addEventListener("click", function (evento) {

    // Pasar producto comprado al inventario

    const botonImportar = evento.target.closest(
        "[data-importar-producto]"
    );

    if (botonImportar) {

        abrirFormularioInventario(
            Number(botonImportar.dataset.compraId),
            Number(botonImportar.dataset.importarProducto)
        );

        return;

    }

    // Eliminar compra

    const botonEliminar = evento.target.closest(
        "[data-id-compra]"
    );

    if (botonEliminar) {

        eliminarCompra(
            Number(botonEliminar.dataset.idCompra),
            botonEliminar
        );

    }

});


// ==========================================
// INICIAR
// ==========================================

mostrarProductos();
cargarHistorial();
