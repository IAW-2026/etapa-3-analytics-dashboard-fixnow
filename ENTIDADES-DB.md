SnapshotKPI
Es una foto del estado del sistema en un momento dado. Lautaro la genera una vez por día consultando las 4 apps externas y guardando el resultado consolidado. Así el dashboard no necesita llamar a las otras apps en tiempo real cada vez que alguien lo abre — simplemente lee el último snapshot.
Campos clave:

fecha — el día del snapshot, es único (un registro por día)
totalUsuarios, totalClientes, totalProfesionales — viene de Rider + Driver App
volumenTransacciones, ingresosNetos, pedidosCompletados — viene de Payments App
calificacionPromedio, totalReseñas — viene de Feedback App

---

TrabajoResumen
Es el registro central de cada trabajo que pasó por la plataforma, con toda la información consolidada de múltiples apps. Cada fila es un trabajo individual.
Campos clave:

trabajoExternoId — el ID del trabajo en la Rider App, para no duplicar
categoria — PLOMERIA, ELECTRICIDAD o GAS
estado — COMPLETADO, CANCELADO o EN_PROGRESO
monto y comisionFixNow — viene de Payments App
calificacion — viene de Feedback App
duracionMinutos — cuánto tardó el trabajo
motivoCancelacion — relación con la tabla de motivos si fue cancelado

---

MotivoCancelacion
Guarda por qué se canceló cada trabajo. Tiene una relación uno a uno con TrabajoResumen — solo existe si el trabajo fue cancelado.
Campos clave:

motivo — texto del motivo ("Cliente canceló", "Sin profesionales disponibles", etc.)
categoria — duplicado acá para poder agrupar cancelaciones por categoría sin hacer join
trabajoResumenId — FK al trabajo cancelado

---

MetricaMensual
Son agregados pre-calculados por mes, para no tener que sumar todos los TrabajoResumen cada vez que alguien carga el gráfico de tendencia. Lautaro los genera periódicamente.
Campos clave:

anio + mes + categoria — la combinación es única. Si categoria es null, son las métricas globales de ese mes; si tiene valor, son las métricas de esa categoría específica
trabajosCompletados, trabajosCancelados — conteos del mes
ingresosTotal, ticketPromedio — datos financieros del mes
clientesNuevos — cuántos clientes se registraron ese mes

---

ProfesionalResumen
Es el perfil de desempeño de cada profesional, consolidado desde Driver App y Feedback App. Se actualiza periódicamente.
Campos clave:

profesionalExternoId — el ID del profesional en la Driver App
calificacionPromedio — promedio de todas sus reseñas
totalTrabajos y totalCancelaciones — para calcular su tasa de éxito
ingresoGenerado — cuánto facturó en total (útil para rankings)
activo — si estuvo activo recientemente
ultimaActividad — fecha del último trabajo, para detectar inactivos

---

ConfigDashboard
Es una tabla de configuración general del dashboard, funciona como un diccionario clave-valor. Por ejemplo:
clave | valor
periodo_default | 6m
ciudad_filtro | Santiago
alerta_rating_minimo | 3.5

Sirve para guardar preferencias del admin sin hardcodear valores en el código.

EL FLUJO ES: Lautaro escribe en todas estas tablas consultando las 4 apps externas → vos, Chiara y Nacho leen de estas tablas para mostrar los gráficos. Nunca el frontend del dashboard llama directamente a las otras apps.
