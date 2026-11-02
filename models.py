
# ==================================================
# SMARTMEAL 2.0
# MODELOS DE BASE DE DATOS
# Parcial N° 2 - Práctica Profesionalizante I
# ==================================================

from pathlib import Path
from datetime import datetime

from peewee import (
    Model,
    SqliteDatabase,
    AutoField,
    CharField,
    DecimalField,
    DateTimeField,
    DateField,
    ForeignKeyField
)

# ==========================
# CONFIGURACIÓN
# ==========================

# Ubicación del proyecto
BASE_DIR = Path(__file__).resolve().parent

# Carpeta donde guardaremos la base de datos
DATOS_DIR = BASE_DIR / "datos"
DATOS_DIR.mkdir(exist_ok=True)

# Base de datos SQLite
db = SqliteDatabase(
    str(DATOS_DIR / "smartmeal.db"),
    pragmas={"foreign_keys": 1}
)


# ==========================
# MODELO BASE
# ==========================

class ModeloBase(Model):
    class Meta:
        database = db


# ==========================
# TABLA DE ALIMENTOS
# ==========================

class Alimento(ModeloBase):

    id = AutoField()

    nombre = CharField(max_length=120)

    categoria = CharField(max_length=50)

    cantidad = DecimalField(
        max_digits=12,
        decimal_places=2
    )

    unidad = CharField(max_length=20)

    fecha_vencimiento = DateField(null=True)


# ==========================
# TABLA DE COMPRAS
# ==========================

class Compra(ModeloBase):

    id = AutoField()

    fecha = DateTimeField(default=datetime.now)

    comercio = CharField(max_length=60)

    modo_pago = CharField(max_length=30)

    total = DecimalField(
        max_digits=12,
        decimal_places=2
    )

    monto_efectivo = DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0
    )


# ==========================
# PRODUCTOS DE CADA COMPRA
# ==========================

class ProductoCompra(ModeloBase):

    id = AutoField()

    compra = ForeignKeyField(
        Compra,
        backref="productos",
        on_delete="CASCADE"
    )

    nombre = CharField(max_length=120)

    cantidad = DecimalField(
        max_digits=12,
        decimal_places=2
    )

    unidad = CharField(max_length=20)

    precio_unitario = DecimalField(
        max_digits=12,
        decimal_places=2
    )


# ==========================
# CREAR TABLAS
# ==========================

def inicializar_base_datos():

    with db.connection_context():

        db.create_tables(
            [
                Alimento,
                Compra,
                ProductoCompra
            ],
            safe=True
        )

    print("Base de datos SmartMeal inicializada.")
