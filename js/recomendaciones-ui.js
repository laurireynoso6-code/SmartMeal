
/* ==========================================
   SMARTMEAL 2.0
   MOSTRAR RECOMENDACIONES EN RECETAS
========================================== */

(function () {
    "use strict";

    const main = document.querySelector("main");

    if (!main) {
        return;
    }

    // ======================================
    // FUNCIONES AUXILIARES
    // ======================================

    function crear(etiqueta, clase = "", texto = "") {
        const elemento = document.createElement(etiqueta);
        elemento.className = clase;
        elemento.textContent = texto;
        return elemento;
    }

    // ======================================
    // CREAR LA SECCION VISUAL
    // ======================================

    const seccion = crear("section", "sm-rec-seccion");
    seccion.id = "recomendaciones-smartmeal";

    const contenedor = crear("div", "sm-rec-contenedor");

    const encabezado = crear("div", "sm-rec-encabezado");
    const introduccion = crear("div");

    const etiqueta = crear(
        "span",
        "sm-rec-etiqueta",
        "SmartMeal inteligente"
    );

    const titulo = crear(
        "h2",
        "sm-rec-titulo",
        "Recomendaciones para vos"
    );

    titulo.id = "titulo-recomendaciones";

    seccion.setAttribute(
        "aria-labelledby",
        titulo.id
    );

    const descripcion = crear(
        "p",
        "sm-rec-descripcion",
        "Descubrí qué podés preparar según los " +
        "alimentos de tu inventario y aprovechá " +
        "los que están próximos a vencer."
    );

    introduccion.append(
        etiqueta,
        titulo,
        descripcion
    );

    const botonActualizar = crear(
        "button",
        "sm-rec-actualizar",
        "Actualizar sugerencias"
    );

    botonActualizar.type = "button";

    encabezado.append(
        introduccion,
        botonActualizar
    );

    const estado = crear(
        "p",
        "sm-rec-estado",
        "Buscando recomendaciones..."
    );

    estado.setAttribute("role", "status");
    estado.setAttribute("aria-live", "polite");

    const grilla = crear("div", "sm-rec-grilla");

    const nota = crear(
        "p",
        "sm-rec-nota",
        "Estas sugerencias comparan los nombres " +
        "de los ingredientes. No verifican si " +
        "tenés cantidad suficiente para cada " +
        "receta ni sustituyen las recomendaciones " +
        "de conservación de alimentos."
    );

    contenedor.append(
        encabezado,
        estado,
        grilla,
        nota
    );

    seccion.appendChild(contenedor);

    // Ubicar las sugerencias después
    // del encabezado principal de Recetas.

    const encabezadoPagina = main.querySelector(
        ".encabezado-pagina"
    );

    if (encabezadoPagina) {
        encabezadoPagina.insertAdjacentElement(
            "afterend",
            seccion
        );
    } else {
        main.prepend(seccion);
    }

    // ======================================
    // MENSAJES Y ENLACES
    // ======================================

    function mostrarAviso(texto, enlaceTexto, destino) {

        grilla.replaceChildren();

        const aviso = crear(
            "div",
            "sm-rec-aviso",
            texto
        );

        if (enlaceTexto && destino) {

            const enlace = crear(
                "a",
                "sm-rec-enlace",
                enlaceTexto
            );

            enlace.href = destino;
            aviso.appendChild(enlace);
        }

        grilla.appendChild(aviso);
    }

    // ======================================
    // CREAR TARJETA DE UNA RECETA
    // ======================================

    function crearTarjeta(receta) {

        const tarjeta = crear(
            "article",
            "sm-rec-tarjeta"
        );

        const porcentaje = Number(
            receta.porcentaje_disponible
        );

        const indicador = crear(
            "span",
            porcentaje === 100
                ? "sm-rec-porcentaje"
                : "sm-rec-porcentaje parcial",
            `${porcentaje}% de ingredientes disponibles`
        );

        const nombre = crear(
            "h3",
            "",
            receta.nombre
        );

        const categoria = crear(
            "p",
            "sm-rec-categoria",
            `${receta.categoria} · ` +
            `${receta.tiempo_minutos} minutos`
        );

        const descripcionReceta = crear(
            "p",
            "sm-rec-info",
            receta.descripcion
        );

        const detalles = crear(
            "div",
            "sm-rec-detalles"
        );

        const disponibles = crear(
            "p",
            "",
            "✓ Tenés: " +
            receta.ingredientes_disponibles.join(", ")
        );

        detalles.appendChild(disponibles);

        if (receta.ingredientes_faltantes.length > 0) {

            const faltantes = crear(
                "p",
                "",
                "Te falta: " +
                receta.ingredientes_faltantes.join(", ")
            );

            detalles.appendChild(faltantes);

        } else {

            detalles.appendChild(
                crear(
                    "p",
                    "",
                    "Todos los ingredientes principales " +
                    "figuran en tu inventario."
                )
            );
        }

        tarjeta.append(
            indicador,
            nombre,
            categoria,
            descripcionReceta,
            detalles
        );

        // Destacar alimentos próximos a vencer

        if (
            Array.isArray(receta.aprovechar_primero) &&
            receta.aprovechar_primero.length > 0
        ) {

            const alerta = crear(
                "div",
                "sm-rec-alerta",
                "⏳ Aprovechá primero: " +
                receta.aprovechar_primero.join(", ")
            );

            tarjeta.appendChild(alerta);
        }

        return tarjeta;
    }

    // ======================================
    // CONSULTAR RECOMENDACIONES A FLASK
    // ======================================

    async function cargarRecomendaciones() {

        botonActualizar.disabled = true;

        estado.textContent = "Analizando tu inventario...";
        grilla.replaceChildren();

        try {

            const respuesta = await fetch(
                "/api/recomendaciones",
                {
                    method: "GET",
                    credentials: "same-origin",
                    cache: "no-store"
                }
            );

            // Sin sesión iniciada
            if (respuesta.status === 401) {

                estado.textContent = "";

                mostrarAviso(
                    "Iniciá sesión para recibir recetas " +
                    "personalizadas según tus alimentos.",
                    "Iniciar sesión",
                    "login.html"
                );

                return;
            }

            if (!respuesta.ok) {

                throw new Error(
                    "No se pudieron consultar " +
                    "las recomendaciones."
                );
            }

            const datos = await respuesta.json();

            if (!Array.isArray(datos.recomendaciones)) {

                throw new Error(
                    "La respuesta del servidor no es válida."
                );
            }

            // No se encontraron recetas compatibles
            if (datos.recomendaciones.length === 0) {

                estado.textContent =
                    "No encontramos recetas compatibles todavía.";

                mostrarAviso(
                    "Registrá alimentos como frutas, " +
                    "verduras, huevos o lácteos " +
                    "para recibir sugerencias.",
                    "Ir a Mis alimentos",
                    "alimentos.html"
                );

                return;
            }

            // Mostrar recomendaciones
            estado.textContent =
                `${datos.recomendaciones.length} sugerencia(s) ` +
                `según ${datos.alimentos_disponibles} ` +
                "alimento(s) disponible(s).";

            datos.recomendaciones.forEach(receta => {

                const tarjeta = crearTarjeta(receta);

                grilla.appendChild(tarjeta);

            });

        } catch (error) {

            estado.textContent =
                "No pudimos cargar las sugerencias.";

            mostrarAviso(
                "Comprobá que SmartMeal esté funcionando " +
                "desde el servidor Flask e intentá nuevamente.",
                null,
                null
            );

        } finally {

            botonActualizar.disabled = false;
        }
    }

    // ======================================
    // EVENTOS
    // ======================================

    botonActualizar.addEventListener(
        "click",
        cargarRecomendaciones
    );

    // Consultar al abrir la página
    cargarRecomendaciones();

})();
