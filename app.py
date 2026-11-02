
# ==================================================
# SMARTMEAL 2.0
# SERVIDOR FLASK - COMPRAS E INVENTARIO
# Practica Profesionalizante I
# ==================================================

from pathlib import Path
from datetime import date
from decimal import Decimal, InvalidOperation

from flask import (
    Flask,
    jsonify,
    request,
    send_from_directory,
    abort
)

from models import (
    db,
    Alimento,
    Compra,
    ProductoCompra,
    inicializar_base_datos
)


# ==========================================
# CONFIGURACION GENERAL
# ==========================================

BASE_DIR = Path(__file__).resolve().parent

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 65536

inicializar_base_datos()


# ==========================================
# PAGINAS HTML
# ==========================================

@app.get("/")
@app.get("/index.html")
def inicio():
    return send_from_directory(BASE_DIR, "index.html")


PAGINAS = {
    "recetas.html",
    "alimentos.html",
    "planes.html",
    "contacto.html",
    "compras.html"
}


@app.get("/pages/<nombre>")
def paginas(nombre):

    if nombre not in PAGINAS:
        abort(404)

    return send_from_directory(BASE_DIR / "pages", nombre)


# ==========================================
# ARCHIVOS ESTATICOS
# ==========================================

@app.get("/css/<path:nombre>")
def estilos(nombre):
    return send_from_directory(BASE_DIR / "css", nombre)


@app.get("/js/<path:nombre>")
def javascript(nombre):
    return send_from_directory(BASE_DIR / "js", nombre)


@app.get("/img/<path:nombre>")
def imagenes(nombre):
    return send_from_directory(BASE_DIR / "img", nombre)


# ==========================================
# VALIDAR NUMEROS
# ==========================================

def convertir_decimal(valor, nombre, permitir_cero=False):

    try:

        if isinstance(valor, bool) or valor is None:
            raise ValueError()

        numero = Decimal(str(valor))

        if not numero.is_finite():
            raise ValueError()

        numero = numero.quantize(Decimal("0.01"))

        if numero < 0 or (numero == 0 and not permitir_cero):
            raise ValueError()

        if numero > Decimal("9999999999.99"):
            raise ValueError()

        return numero

    except (InvalidOperation, ValueError, TypeError):

        raise ValueError(
            f"El campo '{nombre}' debe tener un valor valido."
        )


# ==========================================
# ESTADO DEL SERVIDOR
# ==========================================

@app.get("/api/estado")
def estado():

    with db.connection_context():
        db.execute_sql("SELECT 1").fetchone()

    return jsonify({
        "aplicacion": "SmartMeal 2.0",
        "servidor": "Flask",
        "base_de_datos": "SQLite",
        "estado": "ok"
    })


# ==========================================
# RESUMEN GENERAL
# ==========================================

@app.get("/api/resumen")
def resumen():

    with db.connection_context():

        return jsonify({
            "alimentos": Alimento.select().count(),
            "compras": Compra.select().count(),
            "productos_comprados": ProductoCompra.select().count()
        })


# ==========================================
# HISTORIAL DE COMPRAS
# ==========================================

@app.get("/api/compras")
def listar_compras():

    historial = []

    with db.connection_context():

        compras = (
            Compra.select()
            .order_by(
                Compra.fecha.desc(),
                Compra.id.desc()
            )
        )

        for compra in compras:

            productos = []

            for item in compra.productos.order_by(
                ProductoCompra.id
            ):

                productos.append({
                    "id": item.id,
                    "nombre": item.nombre,
                    "cantidad": str(item.cantidad),
                    "unidad": item.unidad,
                    "precio_unitario": str(
                        item.precio_unitario
                    )
                })

            historial.append({
                "id": compra.id,
                "fecha": compra.fecha.isoformat(),
                "comercio": compra.comercio,
                "modo_pago": compra.modo_pago,
                "total": str(compra.total),
                "monto_efectivo": str(
                    compra.monto_efectivo
                ),
                "productos": productos
            })

    return jsonify(historial)


# ==========================================
# GUARDAR COMPRA
# ==========================================

@app.post("/api/compras")
def guardar_compra():

    datos = request.get_json(silent=True)

    if not isinstance(datos, dict):
        return jsonify({
            "error": "Se necesitan datos JSON validos."
        }), 400

    try:

        comercio = datos.get("comercio", "")
        modo_pago = datos.get("modo_pago", "")
        productos = datos.get("productos", [])

        comercios_permitidos = {
            "Supermercado",
            "Verdulería",
            "Carnicería",
            "Otros"
        }

        pagos_permitidos = {
            "Efectivo",
            "Tarjeta/Mercado Pago",
            "Combinado"
        }

        if (
            not isinstance(comercio, str)
            or comercio not in comercios_permitidos
        ):
            raise ValueError("Selecciona un comercio valido.")

        if (
            not isinstance(modo_pago, str)
            or modo_pago not in pagos_permitidos
        ):
            raise ValueError("Selecciona un modo de pago valido.")

        if (
            not isinstance(productos, list)
            or not 1 <= len(productos) <= 50
        ):
            raise ValueError("Agrega entre 1 y 50 productos.")

        productos_validados = []
        total = Decimal("0.00")

        for producto in productos:

            if not isinstance(producto, dict):
                raise ValueError(
                    "Los productos deben ser objetos validos."
                )

            nombre = producto.get("nombre", "")
            unidad = producto.get("unidad", "unidad")

            if (
                not isinstance(nombre, str)
                or not 1 <= len(nombre.strip()) <= 120
            ):
                raise ValueError(
                    "Cada producto necesita un nombre valido."
                )

            unidades_permitidas = {
                "unidad", "kg", "g", "litro"
            }

            if (
                not isinstance(unidad, str)
                or unidad not in unidades_permitidas
            ):
                raise ValueError(
                    "Unidad de producto no permitida."
                )

            cantidad = convertir_decimal(
                producto.get("cantidad"),
                "cantidad"
            )

            precio = convertir_decimal(
                producto.get("precio_unitario"),
                "precio"
            )

            total += cantidad * precio

            if total > Decimal("9999999999.99"):
                raise ValueError(
                    "El total supera el limite permitido."
                )

            productos_validados.append({
                "nombre": nombre.strip(),
                "cantidad": cantidad,
                "unidad": unidad,
                "precio_unitario": precio
            })

        total = total.quantize(Decimal("0.01"))

        if modo_pago == "Efectivo":

            monto_efectivo = total

        elif modo_pago == "Combinado":

            monto_efectivo = convertir_decimal(
                datos.get("monto_efectivo"),
                "monto_efectivo"
            )

            if monto_efectivo >= total:
                raise ValueError(
                    "El efectivo debe ser menor al total."
                )

        else:

            monto_efectivo = Decimal("0.00")

    except ValueError as error:

        return jsonify({
            "error": str(error)
        }), 400

    with db.atomic():

        compra = Compra.create(
            comercio=comercio,
            modo_pago=modo_pago,
            total=total,
            monto_efectivo=monto_efectivo
        )

        for producto in productos_validados:

            ProductoCompra.create(
                compra=compra,
                **producto
            )

    return jsonify({
        "mensaje": "Compra guardada correctamente.",
        "compra_id": compra.id,
        "total": str(total)
    }), 201


# ==========================================
# ELIMINAR COMPRA
# ==========================================

@app.delete("/api/compras/<int:compra_id>")
def eliminar_compra(compra_id):

    with db.atomic():

        compra = Compra.get_or_none(
            Compra.id == compra_id
        )

        if compra is None:
            return jsonify({
                "error": "Compra no encontrada."
            }), 404

        ProductoCompra.delete().where(
            ProductoCompra.compra == compra
        ).execute()

        compra.delete_instance()

    return jsonify({
        "mensaje": "Compra eliminada correctamente."
    })


# ==========================================
# FUNCIONES DEL INVENTARIO
# ==========================================

def convertir_alimento_a_json(alimento):

    return {
        "id": alimento.id,
        "nombre": alimento.nombre,
        "categoria": alimento.categoria,
        "cantidad": str(alimento.cantidad),
        "unidad": alimento.unidad,
        "fecha_vencimiento": (
            alimento.fecha_vencimiento.isoformat()
            if alimento.fecha_vencimiento
            else None
        )
    }


def validar_datos_alimento(datos):

    if not isinstance(datos, dict):
        raise ValueError("Los datos deben enviarse en JSON.")

    nombre = datos.get("nombre", "")
    categoria = datos.get("categoria", "")
    unidad = datos.get("unidad", "")

    if (
        not isinstance(nombre, str)
        or not 1 <= len(nombre.strip()) <= 120
    ):
        raise ValueError(
            "Ingresá un nombre de alimento válido."
        )

    categorias_permitidas = {
        "Frutas",
        "Verduras",
        "Lácteos",
        "Proteínas",
        "Otros"
    }

    if (
        not isinstance(categoria, str)
        or categoria not in categorias_permitidas
    ):
        raise ValueError(
            "Seleccioná una categoría válida."
        )

    unidades_permitidas = {
        "unidad",
        "kg",
        "g",
        "litro"
    }

    if (
        not isinstance(unidad, str)
        or unidad not in unidades_permitidas
    ):
        raise ValueError(
            "Seleccioná una unidad válida."
        )

    cantidad = convertir_decimal(
        datos.get("cantidad"),
        "cantidad"
    )

    fecha_texto = datos.get("fecha_vencimiento")

    if fecha_texto is None or fecha_texto == "":

        fecha_vencimiento = None

    elif isinstance(fecha_texto, str):

        try:
            fecha_vencimiento = date.fromisoformat(
                fecha_texto
            )

        except ValueError:
            raise ValueError(
                "La fecha de vencimiento no es válida."
            )

    else:

        raise ValueError(
            "La fecha de vencimiento no es válida."
        )

    return {
        "nombre": nombre.strip(),
        "categoria": categoria,
        "cantidad": cantidad,
        "unidad": unidad,
        "fecha_vencimiento": fecha_vencimiento
    }


# ==========================================
# CONSULTAR TODOS LOS ALIMENTOS
# ==========================================

@app.get("/api/alimentos")
def listar_alimentos():

    with db.connection_context():

        alimentos = (
            Alimento.select()
            .order_by(Alimento.nombre, Alimento.id)
        )

        resultado = [
            convertir_alimento_a_json(alimento)
            for alimento in alimentos
        ]

    return jsonify(resultado)


# ==========================================
# AGREGAR ALIMENTO
# ==========================================

@app.post("/api/alimentos")
def agregar_alimento():

    datos = request.get_json(silent=True)

    try:

        alimento_validado = validar_datos_alimento(
            datos
        )

    except ValueError as error:

        return jsonify({
            "error": str(error)
        }), 400

    with db.atomic():

        alimento = Alimento.create(
            **alimento_validado
        )

        resultado = convertir_alimento_a_json(
            alimento
        )

    return jsonify({
        "mensaje": "Alimento agregado correctamente.",
        "alimento": resultado
    }), 201


# ==========================================
# EDITAR ALIMENTO
# ==========================================

@app.put("/api/alimentos/<int:alimento_id>")
def editar_alimento(alimento_id):

    datos = request.get_json(silent=True)

    try:

        alimento_validado = validar_datos_alimento(
            datos
        )

    except ValueError as error:

        return jsonify({
            "error": str(error)
        }), 400

    with db.atomic():

        alimento = Alimento.get_or_none(
            Alimento.id == alimento_id
        )

        if alimento is None:

            return jsonify({
                "error": "Alimento no encontrado."
            }), 404

        for campo, valor in alimento_validado.items():
            setattr(alimento, campo, valor)

        alimento.save()

        resultado = convertir_alimento_a_json(
            alimento
        )

    return jsonify({
        "mensaje": "Alimento actualizado correctamente.",
        "alimento": resultado
    })


# ==========================================
# ELIMINAR ALIMENTO
# ==========================================

@app.delete("/api/alimentos/<int:alimento_id>")
def eliminar_alimento(alimento_id):

    with db.atomic():

        alimento = Alimento.get_or_none(
            Alimento.id == alimento_id
        )

        if alimento is None:

            return jsonify({
                "error": "Alimento no encontrado."
            }), 404

        alimento.delete_instance()

    return jsonify({
        "mensaje": "Alimento eliminado correctamente."
    })


# ==========================================
# INICIAR SERVIDOR
# ==========================================

if __name__ == "__main__":

    print("Iniciando SmartMeal 2.0...")

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=False
    )
