# Navegacion Y Modulos De Iter

Iter deberia navegar por intencion de vida, no por detalle tecnico. La navegacion principal queda como marco estable del producto:

`Hoy` | `Sueños` | `Proyectos` | `Tiempo` | `Recursos`

La app actual puede migrar hacia ese marco sin perder funcionalidad: `Presupuesto` vive dentro de `Recursos`, `Calendario` vive dentro de `Tiempo`, y `Casa` pasa a ser un modulo de proyectos dentro de `Proyectos`.

## Trabajo De Cada Pilar

| Pilar | Pregunta | Trabajo de producto | Primeros modulos |
| --- | --- | --- | --- |
| Hoy | Que necesita mi atencion ahora? | Priorizar accion y bajar carga mental diaria | Esta semana, atencion recomendada, mensaje de Iter, estado de situacion |
| Sueños | Hacia que vida me estoy moviendo? | Mantener deseos visibles y conectados a realidad | Sueños activos, mapa de sueños, hitos cumplidos, proyectos conectados |
| Proyectos | Como lo hago real? | Convertir deseos y necesidades en trabajo concreto | Proyectos activos, bloqueos, decisiones, casa, viajes como planes |
| Tiempo | Cuando ocurre? | Ubicar compromisos, momentos y preparacion en el tiempo | Semana, mes, momentos importantes, viajes, compras/preparacion |
| Recursos | Con que margen cuento? | Mostrar capacidad financiera, presion y tradeoffs | Presion financiera, presupuesto, ingresos, gastos, ahorro, deudas |

## Hoy

`Hoy` es la puerta de entrada. No deberia convertirse en un dashboard completo. Tiene que responder: que hago o miro primero?

Orden principal:

1. Acciones de esta semana.
2. Atencion recomendada, con el globo de Iter.
3. Estado de situacion: presion financiera, ahorro acumulado, acciones pendientes, progreso del año.
4. Contexto debajo: progreso anual y sueños en movimiento.

Modulos base:

| Modulo | Para que sirve | Fuente |
| --- | --- | --- |
| Esta semana | Mostrar pocas acciones que importan ahora | Calendario, proyectos bloqueados, tareas de recursos, viajes |
| Atencion recomendada | Mostrar una o dos señales calmadas, no una pared de alertas | Presion financiera, compromisos cercanos, decisiones bloqueadas |
| Mensaje de Iter | Dar una lectura breve y humana del estado actual | Presion, tiempo y proyectos |
| Estado de situacion | Resumir metricas clave sin abrir cada modulo | Presupuesto, ahorro, acciones, hitos |
| Progreso y sueños | Mostrar evidencia de movimiento debajo de la accion | Proyectos, sueños, hitos cumplidos |

## Sueños

`Sueños` no deberia ser un moodboard aislado. Es el lugar donde los deseos quedan conectados a proyectos, tiempo y recursos.

Modulos base:

| Modulo | Para que sirve |
| --- | --- |
| Sueños activos | Los pocos sueños que estan vivos ahora |
| Mapa de sueños | Relaciona sueños, proyectos, recursos y tiempo |
| Hitos cumplidos | Hace visible el avance sin convertirlo en presion |
| Sueños en movimiento | Sueños con avance, bloqueo o accion proxima |
| Sueños en pausa | Guarda ideas sin exigir accion ahora |

Cada sueño deberia poder mostrar proyectos vinculados, recursos necesarios, fechas relevantes y proxima accion significativa.

## Proyectos

`Proyectos` es donde la intencion se vuelve ejecucion. Deberia absorber el area actual de `Casa` y futuros proyectos de vida.

Modulos base:

| Modulo | Para que sirve | Fuente actual |
| --- | --- | --- |
| Proyectos activos | Mostrar que se esta construyendo o cambiando | `proyectos` |
| Bloqueos | Mostrar decisiones, dinero o timing que frenan avance | `bloqueos`, presion financiera |
| Proximas decisiones | Hacer visibles elecciones pequeñas que desbloquean movimiento | Proyectos y calendario |
| Casa / hogar | Renovacion y proyectos del hogar | `TabGantt` |
| Viajes como planes | Viajes antes de mirarlos como calendario o gasto | `viajes` |

Los viajes conservan su azul semantico. No salen del producto: aparecen como planes en `Proyectos`, fechas en `Tiempo`, costos en `Recursos` y atenciones en `Hoy`.

## Tiempo

`Tiempo` es mas que calendario. Es donde compromisos, preparacion y momentos importantes se vuelven visibles.

Modulos base:

| Modulo | Para que sirve | Fuente actual |
| --- | --- | --- |
| Semana | Ver compromisos y preparacion inmediata | `eventos`, `viajes`, `comprasSuper`, `cumpleanos` |
| Mes | Leer ritmo general y planificacion | Vista mensual actual |
| Momentos importantes | Cumpleaños, graduaciones, nacimientos, bodas, mudanzas y otros hitos personales | `cumpleanos`, futuros tipos de momento |
| Viajes | Fechas, preparacion y ritmo de viaje | `viajes` |
| Preparacion del hogar | Compras y supermercado como tareas con momento | `comprasSuper` |

Los momentos importantes deberian generar preparacion cuidadosa, no solo recordatorios.

## Recursos

`Recursos` contiene la realidad financiera y los tradeoffs. Conserva la potencia del presupuesto actual, pero reorganizada alrededor de decisiones calmadas.

Modulos base:

| Modulo | Para que sirve | Fuente actual |
| --- | --- | --- |
| Presion financiera | Entender si lo que viene entra en margen | Analizador actual |
| Presupuesto | Estructura mensual y margen disponible | `TabPresupuesto` |
| Ingresos y palancas | Ingreso estable y margen posible | `base`, `palancas` |
| Gastos | Fijos, variables, eventos, viajes, supermercado | `suministros`, `gastosVariables`, `eventos`, `viajes`, `comprasSuper` |
| Deudas y tarjetas | Presion futura y calendario de pagos | `deudas` |
| Ahorro | Margen acumulado y progreso | Derivado del presupuesto |

Regla de color: ingresos quedan en verde, viajes quedan en su azul, y la marca Iter no reemplaza esos colores semanticos.

## Entidades Transversales

Algunas entidades no deberian ser navegacion principal porque se entienden mejor desde varias lentes.

| Entidad | Hoy | Sueños | Proyectos | Tiempo | Recursos |
| --- | --- | --- | --- | --- | --- |
| Viajes | Atenciones y acciones proximas | Sueño de viajar, si aplica | Plan y decisiones | Fechas y preparacion | Costo, presion, deudas |
| Momentos importantes | Preparacion de esta semana | Presencia y vinculos | Proyecto de preparacion si hace falta | Fecha y recordatorio | Impacto en presupuesto |
| Supermercado / compras hogar | Que comprar ahora | Normalmente no aplica | Operacion del hogar si crece | Momento de compra | Costo e impacto en tarjeta |
| Casa / hogar | Acciones y bloqueos | Sueño de vivir mejor | Area principal de ejecucion | Ventanas de trabajo | Costo y deuda del proyecto |

## Camino De Migracion

1. Crear la nueva navegacion principal: `Hoy`, `Sueños`, `Proyectos`, `Tiempo`, `Recursos`.
2. Mapear las pantallas actuales sin cambiar su logica interna: `Presupuesto -> Recursos`, `Calendario -> Tiempo`, `Casa -> Proyectos`.
3. Agregar `Hoy` como superficie compuesta usando datos existentes.
4. Agregar `Sueños` como placeholder ligero con el modelo de `Sueños en movimiento`, y ampliar cuando el modelo de datos este mas claro.
5. Extraer modulos reutilizables solo cuando se repitan patrones entre pilares.

## Reglas De Modulo

- Un modulo responde una pregunta clara.
- Un modulo muestra una proxima accion cuando se espera accion.
- Un modulo explica por que importa ahora, especialmente en `Hoy`.
- Un modulo puede aparecer en mas de un pilar, pero cada aparicion necesita una lente distinta.
- Un color debe significar marca, estado semantico o tipo de entidad; no las tres cosas a la vez.