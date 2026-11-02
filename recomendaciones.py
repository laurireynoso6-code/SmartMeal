
# ==================================================
# SMARTMEAL 2.0
# MOTOR DE RECOMENDACIONES DE RECETAS
# Practica Profesionalizante I
# ==================================================

import re
import unicodedata

from datetime import date
from decimal import Decimal

from flask import jsonify

from models import db, Alimento


# ==========================================
# CATALOGO DE RECETAS
# ==========================================

RECETAS = [
    {
        "id": "licuado-banana",
        "nombre": "Licuado de banana",
        "categoria": "Desayuno o merienda",
        "tiempo_minutos": 5,
        "ingredientes": ["banana", "leche"],
        "descripcion": (
            "Una preparación sencilla con banana y leche."
        )
    },
    {
        "id": "omelette-queso",
        "nombre": "Omelette de queso",
        "categoria": "Almuerzo o cena",
        "tiempo_minutos": 15,
        "ingredientes": ["huevo", "queso"],
        "descripcion": (
            "Una opción rápida con huevos y queso."
        )
    },
    {
        "id": "tortilla-papas",
        "nombre": "Tortilla de papas",
        "categoria": "Almuerzo o cena",
        "tiempo_minutos": 30,
        "ingredientes": ["papa", "huevo", "cebolla"],
        "descripcion": (
            "Una tortilla casera con ingredientes cotidianos."
        )
    },
    {
        "id": "ensalada-fresca",
        "nombre": "Ensalada fresca",
        "categoria": "Almuerzo",
        "tiempo_minutos": 15,
        "ingredientes": ["lechuga", "tomate", "zanahoria"],
        "descripcion": (
            "Una ensalada sencilla con vegetales frescos."
        )
    },
    {
        "id": "arroz-verduras",
        "nombre": "Arroz con verduras",
        "categoria": "Almuerzo o cena",
        "tiempo_minutos": 30,
        "ingredientes": ["arroz", "zanahoria", "cebolla"],
        "descripcion": (
            "Arroz acompañado de verduras."
        )
    },
    {
        "id": "fideos-tomate",
        "nombre": "Fideos con tomate",
        "categoria": "Almuerzo o cena",
        "tiempo_minutos": 25,
        "ingredientes": ["fideos", "tomate", "cebolla"],
        "descripcion": (
            "Una preparación de pasta con tomate."
        )
    },
    {
        "id": "pollo-papas",
        "nombre": "Pollo con papas",
        "categoria": "Almuerzo o cena",
        "tiempo_minutos": 45,
        "ingredientes": ["pollo", "papa", "cebolla"],
        "descripcion": (
            "Pollo acompañado de papas y cebolla."
        )
    },
    {
        "id": "ensalada-frutas",
        "nombre": "Ensalada de frutas",
        "categoria": "Postre o merienda",
        "tiempo_minutos": 15,
        "ingredientes": ["manzana", "banana", "naranja"],
        "descripcion": (
            "Una mezcla sencilla de frutas frescas."
        )
    },
    {
        "id": "sandwich-queso-tomate",
        "nombre": "Sándwich de queso y tomate",
        "categoria": "Almuerzo o merienda",
        "tiempo_minutos": 10,
        "ingredientes": ["pan", "queso", "tomate"],
        "descripcion": (
            "Un sándwich rápido con queso y tomate."
        )
    },
    {
        "id": "avena-banana",
        "nombre": "Avena con banana y leche",
        "categoria": "Desayuno o merienda",
        "tiempo_minutos": 10,
        "ingredientes": ["avena", "banana", "leche"],
        "descripcion": (
            "Una preparación de avena, banana y leche."
        )
    }
]


# ==========================================
# NOMBRES ALTERNATIVOS DE ALIMENTOS
# ==========================================

SINONIMOS = {
    "banana": ["banana", "bananas", "platano", "platanos"],
    "leche": ["leche"],
    "huevo": ["huevo", "huevos"],
    "queso": ["queso", "quesos", "mozzarella", "muzzarella"],
    "papa": ["papa", "papas", "patata", "patatas"],
    "cebolla": ["cebolla", "cebollas"],
    "lechuga": ["lechuga", "lechugas"],
    "tomate": ["tomate", "tomates"],
    "zanahoria": ["zanahoria", "zanahorias"],
    "arroz": ["arroz"],
    "fideos": ["fideo", "fideos", "pasta", "espagueti"],
    "pollo": ["pollo", "pechuga", "suprema"],
    "manzana": ["manzana", "manzanas"],
    "naranja": ["naranja", "naranjas"],
    "pan": ["pan", "panes"],
    "avena": ["avena"]
}


# ==========================================
# NORMALIZAR NOMBRES
# ==========================================

def normalizar_texto(texto):

    # Pasar a minúsculas y eliminar tildes.
    texto = unicodedata.normalize(
        "NFD",
        texto.lower()
    )

    texto = "".join(
        letra
        for letra in texto
        if unicodedata.category(letra) != "Mn"
    )

    return texto


def coincide_ingrediente(ingrediente, nombre_alimento):

    # Separar el nombre en palabras.
    # Ejemplo: "Leche entera" -> {"leche", "entera"}

    palabras = set(
        re.findall(
            r"[a-z0-9]+",
            normalizar_texto(nombre_alimento)
        )
    )

    alternativas = SINONIMOS.get(
        ingrediente,
        [ingrediente]
    )

    return any(
        alternativa in palabras
        for alternativa in alternativas
    )


# ==========================================
# CONSULTAR ALIMENTOS DISPONIBLES
# ==========================================

def obtener_inventario_vigente():

    hoy = date.today()

    with db.connection_context():

        alimentos = list(Alimento.select())

    disponibles = []

    for alimento in alimentos:

        cantidad = Decimal(str(alimento.cantidad))

        # No utilizar alimentos sin cantidad.
        if cantidad <= 0:
            continue

        vencimiento = alimento.fecha_vencimiento

        # No recomendar alimentos cuya fecha
        # de vencimiento ya pasó.
        if vencimiento and vencimiento < hoy:
            continue

        disponibles.append(alimento)

    return disponibles


# ==========================================
# ANALIZAR UNA RECETA
# ==========================================

def analizar_receta(receta, inventario):

    hoy = date.today()

    ingredientes_disponibles = []
    ingredientes_faltantes = []
    alimentos_por_vencer = []

    for ingrediente in receta["ingredientes"]:

        # Buscar los alimentos que coinciden
        # con el ingrediente solicitado.

        coincidencias = [
            alimento
            for alimento in inventario
            if coincide_ingrediente(
                ingrediente,
                alimento.nombre
            )
        ]

        if not coincidencias:

            ingredientes_faltantes.append(
                ingrediente
            )

            continue

        ingredientes_disponibles.append(
            ingrediente
        )

        # Revisar si podemos aprovechar
        # algún alimento próximo a vencer.

        for alimento in coincidencias:

            if not alimento.fecha_vencimiento:
                continue

            dias_restantes = (
                alimento.fecha_vencimiento - hoy
            ).days

            if 0 <= dias_restantes <= 7:

                if alimento.nombre not in alimentos_por_vencer:

                    alimentos_por_vencer.append(
                        alimento.nombre
                    )

    total_ingredientes = len(
        receta["ingredientes"]
    )

    coincidencias = len(
        ingredientes_disponibles
    )

    porcentaje = round(
        coincidencias * 100 / total_ingredientes
    )

    return {
        "id": receta["id"],
        "nombre": receta["nombre"],
        "categoria": receta["categoria"],
        "descripcion": receta["descripcion"],
        "tiempo_minutos": receta["tiempo_minutos"],
        "porcentaje_disponible": porcentaje,
        "ingredientes_disponibles": ingredientes_disponibles,
        "ingredientes_faltantes": ingredientes_faltantes,
        "aprovechar_primero": alimentos_por_vencer,
        "puede_prepararse": (
            len(ingredientes_faltantes) == 0
        )
    }


# ==========================================
# RECOMENDAR RECETAS
# ==========================================

def generar_recomendaciones():

    inventario = obtener_inventario_vigente()

    recomendaciones = []

    for receta in RECETAS:

        resultado = analizar_receta(
            receta,
            inventario
        )

        cantidad_disponible = len(
            resultado["ingredientes_disponibles"]
        )

        cantidad_necesaria = len(
            receta["ingredientes"]
        )

        # Mostrar recetas con al menos
        # la mitad de ingredientes presentes.
        if cantidad_disponible * 2 < cantidad_necesaria:
            continue

        recomendaciones.append(resultado)

    # Primero las recetas más completas.
    # Entre resultados similares, priorizar
    # los alimentos próximos a vencer.

    recomendaciones.sort(
        key=lambda receta: (
            receta["porcentaje_disponible"],
            len(receta["aprovechar_primero"])
        ),
        reverse=True
    )

    return {
        "alimentos_disponibles": len(inventario),
        "total_recetas_analizadas": len(RECETAS),
        "recomendaciones": recomendaciones[:6],
        "mensaje": (
            "Recomendaciones generadas correctamente."
            if recomendaciones
            else "Todavía no encontramos recetas compatibles."
        )
    }


# ==========================================
# REGISTRAR ENDPOINT EN FLASK
# ==========================================

def registrar_recomendaciones(app):

    @app.get("/api/recomendaciones")
    def obtener_recomendaciones():

        resultado = generar_recomendaciones()

        return jsonify(resultado)

    print("Motor de recomendaciones activado.")
