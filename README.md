# analytics-dashboard

Aplicación **Analytics Dashboard** del [Proyecto IAW 2026](https://iaw-2026.github.io/proyecto/) — comisión `Fix Now`.

Herramienta de reportes consolidados (Etapa 3): métricas del sistema completo consultando las APIs de cada webapp individual.

---

Enunciado completo: <https://iaw-2026.github.io/proyecto/>

---

# FixNow - Analytics Dashboard

### Link al deploy de producción

**[Visitar FixNow Analytics Dashboard en Producción](https://etapa-3-analytics-dashboard-fixnow-ajqfdm9m0.vercel.app/)**

---

### 1. Breve descripción del proyecto

El Analytics Dashboard de FixNow es una webapp de lectura y análisis que consolida los datos del ecosistema completo de la plataforma. Consume información de las cuatro aplicaciones del sistema — Rider App, Driver App, Payments App y Feedback App — y los presenta en un único panel centralizado, permitiendo al administrador del negocio tomar decisiones informadas en tiempo real.

La complejidad de esta aplicación no reside en operaciones CRUD, sino en la consolidación de múltiples fuentes de datos y su presentación de forma útil y accionable. A través de tres vistas diferenciadas, el dashboard ofrece desde métricas globales del negocio hasta el análisis operacional interactivo por categoría de servicio y el monitoreo individualizado de cada profesional de la plataforma.

---

### 2. Credenciales de acceso

| Rol           | Email                     | Contraseña     |
| ------------- | ------------------------- | -------------- |
| Administrador | `admin1@fxnanalytics.com` | `iaw-fixnow26` |

> El acceso está restringido a usuarios con rol de administrador mediante autenticación con Clerk.

---

### 3. Instrucciones para utilizar y evaluar la aplicación

#### Vista: Resumen General

Es la pantalla de inicio del dashboard. Presenta una foto consolidada del estado del ecosistema:

1. **KPI Cards** — Revisa los indicadores clave del negocio: usuarios totales, satisfacción global y un bloque financiero integrado de Payments App. El resumen financiero muestra volumen total procesado, ingresos netos estimados para FixNow y monto promedio por pedido. Además, permite descargar un reporte financiero en Excel con datos consolidados de pagos, ingresos, estados de pago, evolución mensual y transacciones.
2. **Trabajos por Categoría** — Gráfico de torta con la distribución de servicios entre Plomería, Electricidad y Gas. Hover sobre cada segmento para ver el número exacto.
3. **Tasa de Éxito** — Gráfico de barras comparando trabajos completados vs. cancelados por categoría.
4. **Tendencia de Ingresos** — Área chart con la evolución mensual de ingresos de los últimos meses.
5. **Top Profesionales** — Ranking de los 5 mejor calificados con su categoría, ciudad y cantidad de trabajos.

#### Vista: Análisis de Operaciones

Vista orientada a la Inteligencia de Negocios (BI) y el análisis operacional detallado, equipada con descubrimientos automáticos e interactividad gerencial:

1. **Selector de período** — Usá los botones en el header (30 días / 90 días / 6 meses / 1 año) para filtrar todos los gráficos, KPIs y cálculos matemáticos simultáneamente.
2. **Panel de Insights Automáticos** — Banner superior que procesa patrones en tiempo real utilizando la técnica de Progressive Disclosure. Muestra titulares de negocio (ej. alertas de baja demanda por día de la semana, foco operativo en cancelaciones y días pico). Al hacer clic en un insight, se abre un modal con el desglose del Origen del Dato y la Recomendación de Negocio accionable.
3. **Interactividad Gerencial (Drill-down)** — Los gráficos de Trabajos, Tasa de Éxito y Ticket Promedio responden a eventos de clic. Al seleccionar un segmento o barra, se despliega un panel analítico que cruza la información para revelar métricas críticas: Dinero en la mesa (ingresos perdidos por cancelaciones), Ratio de pérdida, Facturación Bruta (GMV) y Comisión Neta..
4. **Comparativa Operativa y Financiera (Doble Eje Y)** — Gráfico ComposedChart diseñado para evitar distorsiones de escala. Cruza los ingresos en millones (área de fondo, eje izquierdo) con el volumen de trabajos y clientes en unidades (líneas, eje derecho), permitiendo correlacionar visualmente el esfuerzo operativo con el retorno financiero.
5. **Análisis de Cancelaciones** — Desglose optimizado mediante un gráfico de barras horizontales con el Top 5 de motivos exactos de cancelación, acompañado de un gráfico de tasas porcentuales de caída por cada oficio.
6. **Insight Financiero de Payments** — Panel específico de Payments App que analiza la efectividad de pagos, el control de riesgo y la rentabilidad de la plataforma. Cada insight es interactivo y abre un modal con el origen del dato y una recomendación de negocio.

7. **Estado de Pagos** — Gráfico de barras que clasifica las operaciones según su estado: pagadas, pendientes, en proceso o fallidas. Permite monitorear rápidamente la salud financiera del sistema y detectar posibles riesgos operativos vinculados al cobro de servicios.

#### Vista: Monitoreo de Profesionales

Vista focalizada en el desempeño individual de los profesionales:

1. **Top Profesionales con filtros** — Filtrá el ranking por categoría de servicio (Plomería / Electricidad / Gas) y por ciudad. Los botones de categoría adoptan el color identificatorio de cada oficio. La lista de ciudades disponibles se carga dinámicamente desde la base de datos.
2. **Ranking financiero estimado de profesionales** — Ranking generado desde Payments App que identifica qué profesionales aportan mayor facturación estimada a la plataforma. El cálculo cruza los trabajos registrados con los datos de profesionales disponibles, mostrando total generado, comisión estimada para FixNow, cantidad de trabajos y monto promedio por servicio.
3. **Distribución de ratings** — Histograma de barras con escala de color progresiva (rojo → naranja → amarillo → verde) que muestra cuántas reseñas acumuló la plataforma en cada nivel de 1 a 5 estrellas. El total de reseñas se refleja en el subtítulo de la card.
4. **Tasa de aceptación de reseñas** — Donut chart con el porcentaje de aceptación en el centro, acompañado del conteo absoluto y relativo de reseñas aceptadas y rechazadas, y una barra de progreso que refuerza la proporción visualmente.
5. **Alertas de calidad** — Tabla de profesionales activos que superan alguno de los umbrales de riesgo: rating promedio por debajo de 3.5 o más de 10 cancelaciones. Cada fila muestra la tasa de cancelación calculada sobre el total de trabajos, y clasifica el riesgo en **Alto** (rating < 3.0 o cancelaciones > 20) o **Medio** para el resto. Los valores que disparan la alerta se destacan en rojo.

---

### 4. Comentarios técnicos

**Stack tecnológico:**

- **Frontend:** Next.js 15 (App Router), React, TailwindCSS, Recharts, SWR
- **Autenticación:** Clerk
- **Base de datos & ORM:** PostgreSQL (Supabase) gestionado a través de Prisma ORM v7
- **Sincronización de datos:** Cron job interno que consume los endpoints `/analytics` de cada aplicación del ecosistema

**Arquitectura de datos:**

El dashboard mantiene su propia base de datos con tablas optimizadas para lectura analítica (`SnapshotKPI`, `TrabajoResumen`, `MetricaMensual`, `ProfesionalResumen`). Un proceso de sincronización periódico consulta las APIs externas y consolida los datos localmente, evitando dependencias en tiempo real y garantizando performance en el frontend.

**Fuentes de datos por sección:**

| Sección                        | Fuente                    |
| ------------------------------ | ------------------------- |
| Usuarios totales               | Rider App + Driver App    |
| Volumen e ingresos             | Payments App              |
| Resumen financiero             | Payments App              |
| Estado de pagos                | Payments App              |
| Ranking financiero profesional | Payments App + Driver App |
| Satisfacción y ratings         | Feedback App              |
| Tasa de aceptación de reseñas  | Feedback App              |
| Trabajos y cancelaciones       | Rider App                 |
| Profesionales                  | Driver App + Feedback App |

**Decisiones de diseño y rendimiento:**

- **Caché en Cliente:** Los datos se cachean localmente utilizando SWR para evitar llamadas en cascada a las 4 aplicaciones en cada re-renderizado del dashboard.

- **Aislamiento de Componentes (Evitar Merge Conflicts):** Las lógicas visuales e interactivas de las distintas vistas (como AnalisisCharts.tsx y AnalisisInsightsBanner.tsx) se modularizaron estrictamente. Esto permitió al equipo trabajar en paralelo sobre distintas páginas sin colisionar ni alterar los layouts base compartidos de la aplicación.

- **Procesamiento Matemático en el Cliente:** Los cálculos complejos para el Business Intelligence (como la detección de días de la semana con menor demanda o el cruce de pérdida financiera) se realizan de manera diferida mediante useMemo, aprovechando los datos ya en memoria de SWR sin sobrecargar las rutas de la API.

- **Agrupación de Fechas Eficiente:** El selector de período filtra los datos de TrabajoResumen por fechaCreacion, permitiendo análisis histórico real. A su vez, las métricas agregadas (MetricaMensual) se pre-calculan para optimizar la carga de los gráficos de tendencia.

- **Población de Datos (Seed):** El seed de desarrollo incluye datos históricos desde 2024 con patrones intencionales (estacionalidad y fluctuaciones semanales por categoría) forzando al algoritmo del Dashboard a detectar y emitir recomendaciones de negocio reales durante la evaluación.
- **Exportación Financiera en Excel:** La sección de Payments App incorpora una descarga de reporte financiero en formato Excel, organizado en hojas separadas para resumen ejecutivo, indicadores, ingresos por categoría, estados de pago, evolución mensual, transacciones y datos para gráficos. Esto permite que el administrador pueda analizar la información fuera del dashboard.

- **Ranking Financiero sin modificar Backend:** El ranking financiero de profesionales se calcula desde el frontend utilizando endpoints ya existentes. Se cruzan datos de trabajos y profesionales para estimar la facturación generada por cada profesional, la comisión correspondiente para FixNow y el promedio por servicio, evitando cambios en las rutas del backend.

- **Separación de lógica financiera:** Los componentes relacionados con Payments App se modularizaron en archivos independientes, como `FinancialKpiCard.tsx`, `PaymentsFinancialInsight.tsx`, `PaymentStatusChart.tsx`, `ProfessionalRevenueRanking.tsx` y `ExportFinancialExcelButton.tsx`. Esto mantiene el dashboard ordenado y reduce el riesgo de conflictos con componentes de otras apps.

- **Filtrado Dinámico con Re-fetch Selectivo (SWR):** Los filtros de Top Profesionales (categoría y ciudad) usan una clave de caché compuesta (`top-professionals-{categoria}-{ciudad}`), de modo que SWR re-fetchea únicamente cuando cambia el filtro activo, sin invalidar el resto de la caché del dashboard.

- **Clasificación de Riesgo en Servidor:** La lógica de alertas de calidad se resuelve en la API route (`/api/profesionales/alertas`) mediante una query con `OR` en Prisma, enviando al cliente únicamente los registros que superan los umbrales. La clasificación secundaria Alto/Medio se calcula en el componente con los datos ya filtrados, sin llamadas adicionales.

- **Histograma Calculado desde Datos Granulares:** La distribución de ratings se deriva de `TrabajoResumen.calificacion` (ratings individuales por trabajo) en lugar de usar el promedio de `ProfesionalResumen`, lo que refleja el volumen real de reseñas por nivel de estrella.

- **Extensión de Schema con Compatibilidad hacia Atrás:** Los campos `reseñasAceptadas` y `reseñasRechazadas` se agregaron a `SnapshotKPI` con `@default(0)`, de modo que los registros existentes no se rompen y el sync usa `?? 0` al leer de la Feedback App, permitiendo un rollout gradual sin bloquear la funcionalidad si la app externa aún no expone esos campos.

**Contrato de integración — Feedback App (`GET /analytics`):**

| Campo | Tipo | Descripción |
| --- | --- | --- |
| `calificacionPromedio` | `Float` | Promedio global de todas las reseñas |
| `totalReseñas` | `Int` | Total de reseñas recibidas |
| `reseñasAceptadas` | `Int` | Reseñas que pasaron moderación / fueron publicadas |
| `reseñasRechazadas` | `Int` | Reseñas rechazadas por moderación |
