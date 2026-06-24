-- CreateEnum
CREATE TYPE "Categoria" AS ENUM ('PLOMERIA', 'ELECTRICIDAD', 'GAS');

-- CreateEnum
CREATE TYPE "EstadoTrabajo" AS ENUM ('COMPLETADO', 'CANCELADO', 'EN_PROGRESO');

-- CreateTable
CREATE TABLE "SnapshotKPI" (
    "id" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "totalUsuarios" INTEGER NOT NULL,
    "totalClientes" INTEGER NOT NULL,
    "totalProfesionales" INTEGER NOT NULL,
    "volumenTransacciones" DECIMAL(14,2) NOT NULL,
    "ingresosNetos" DECIMAL(14,2) NOT NULL,
    "pedidosCompletados" INTEGER NOT NULL,
    "calificacionPromedio" DOUBLE PRECISION NOT NULL,
    "totalReseñas" INTEGER NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SnapshotKPI_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrabajoResumen" (
    "id" TEXT NOT NULL,
    "trabajoExternoId" TEXT NOT NULL,
    "categoria" "Categoria" NOT NULL,
    "estado" "EstadoTrabajo" NOT NULL,
    "monto" DECIMAL(12,2),
    "comisionFixNow" DECIMAL(12,2),
    "calificacion" DOUBLE PRECISION,
    "duracionMinutos" INTEGER,
    "fechaCreacion" TIMESTAMP(3) NOT NULL,
    "fechaFinalizacion" TIMESTAMP(3),
    "ciudad" TEXT,

    CONSTRAINT "TrabajoResumen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MotivoCancelacion" (
    "id" TEXT NOT NULL,
    "motivo" TEXT NOT NULL,
    "categoria" "Categoria" NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "trabajoResumenId" TEXT NOT NULL,

    CONSTRAINT "MotivoCancelacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricaMensual" (
    "id" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "categoria" "Categoria",
    "trabajosCompletados" INTEGER NOT NULL,
    "trabajosCancelados" INTEGER NOT NULL,
    "ingresosTotal" DECIMAL(14,2) NOT NULL,
    "clientesNuevos" INTEGER NOT NULL,
    "ticketPromedio" DECIMAL(12,2) NOT NULL,

    CONSTRAINT "MetricaMensual_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfesionalResumen" (
    "id" TEXT NOT NULL,
    "profesionalExternoId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" "Categoria" NOT NULL,
    "ciudad" TEXT NOT NULL,
    "calificacionPromedio" DOUBLE PRECISION NOT NULL,
    "totalTrabajos" INTEGER NOT NULL,
    "totalCancelaciones" INTEGER NOT NULL,
    "ingresoGenerado" DECIMAL(14,2) NOT NULL,
    "ultimaActividad" TIMESTAMP(3) NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfesionalResumen_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfigDashboard" (
    "id" TEXT NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfigDashboard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SnapshotKPI_fecha_key" ON "SnapshotKPI"("fecha");

-- CreateIndex
CREATE UNIQUE INDEX "TrabajoResumen_trabajoExternoId_key" ON "TrabajoResumen"("trabajoExternoId");

-- CreateIndex
CREATE UNIQUE INDEX "MotivoCancelacion_trabajoResumenId_key" ON "MotivoCancelacion"("trabajoResumenId");

-- CreateIndex
CREATE UNIQUE INDEX "MetricaMensual_anio_mes_categoria_key" ON "MetricaMensual"("anio", "mes", "categoria");

-- CreateIndex
CREATE UNIQUE INDEX "ProfesionalResumen_profesionalExternoId_key" ON "ProfesionalResumen"("profesionalExternoId");

-- CreateIndex
CREATE UNIQUE INDEX "ConfigDashboard_clave_key" ON "ConfigDashboard"("clave");

-- AddForeignKey
ALTER TABLE "MotivoCancelacion" ADD CONSTRAINT "MotivoCancelacion_trabajoResumenId_fkey" FOREIGN KEY ("trabajoResumenId") REFERENCES "TrabajoResumen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
