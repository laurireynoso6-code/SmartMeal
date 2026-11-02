
# ==================================================
# SMARTMEAL 2.0
# MODELOS DE BASE DE DATOS
# Practica Profesionalizante I
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
    ForeignKeyField,
    BooleanField
)


# ==========================================
# CONFIGURACION DE SQLITE
# ==========================================

BASE_DIR = Path(__file__).resolve().parent

DATOS_DIR = BASE_DIR / "datos"
DATOS_DIR.mkdir(exist_ok=True)

db = SqliteDatabase(
    str(DATOS_DIR / "smartmeal.db"),
    pragmas={"foreign_keys": 1}
)


# ==========================================
# MODELO BASE
# ==========================================

class ModeloBase(Model):

    class Meta:
        database = db


# ==========================================
# TABLA: ALIMENTOS
# ==========================================

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


# ==========================================
# TABLA: COMPRAS
# ==========================================

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


# ==========================================
# TABLA: PRODUCTOS DE UNA COMPRA
# ==========================================

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


# ==========================================
# TABLA: USUARIOS
# ==========================================

class Usuario(ModeloBase):

    id = AutoField()

    nombre_usuario = CharField(
        max_length=50,
        unique=True
    )

    # Guardaremos un hash, no la contraseña.
    password_hash = CharField(
        max_length=255
    )

    fecha_creacion = DateTimeField(
        default=datetime.now
    )

    activo = BooleanField(default=True)


# ==========================================
# INICIALIZAR BASE DE DATOS
# ==========================================

def inicializar_base_datos():

    with db.connection_context():

        db.create_tables(
            [
                Alimento,
                Compra,
                ProductoCompra,
                Usuario
            ],
            safe=True
        )

    print("Base de datos SmartMeal inicializada.")
