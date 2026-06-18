export const BASE = {
  ingresos_fijos: 6653,
  gastos_fijos: 1578.62,
  deudas: 1766.52,
  previsiones: 383.33,
  presupuesto_variable: 500,
  coste_coche: 5500,
  detalle_fijos: [
    { nombre: "Hipoteca", importe: 1275.36 },
    { nombre: "Seguro de vida", importe: 103.15 },
    { nombre: "Seguro de hogar", importe: 44.11 },
    { nombre: "Seguro de coche", importe: 55 },
    { nombre: "Comunidad", importe: 42 },
    { nombre: "Derramas", importe: 14 },
    { nombre: "Electricidad", importe: 52 },
    { nombre: "Gas", importe: 80 },
    { nombre: "Agua", importe: 50 },
    { nombre: "Internet + movil", importe: 43 },
    { nombre: "Gym Sofi", importe: 45 },
  ],
  detalle_ingresos: [
    { nombre: "Sueldo Sofi", importe: 2005, recurrente: true },
    { nombre: "Sueldo Marqui", importe: 2048, recurrente: true },
    { nombre: "Sueldo Marqui 2", importe: 2600, recurrente: true, desde: "feb" },
  ],
  detalle_deudas: [
    { nombre: "Marti / Tere", importe: 1018 },
    { nombre: "Mesas", importe: 49.5 },
    { nombre: "Poliza Sofi", importe: 425.12 },
    { nombre: "Cama", importe: 273.9 },
  ],
  ingresos_puntuales_mayo: [{ nombre: "Devolucion IRPF Sofi", importe: 310 }],
  prestamo_coche: { importe: 1800, vence: "2025-06" },
};

export const DEMO_DEUDAS = [
  {
    id: 1,
    nombre: "Marti / Tere",
    tipo: "cuotas",
    cuota: 1000,
    interes_mensual: 18,
    cuotas_totales: 24,
    cuota_actual: 5,
    mes_inicio: "2024-12",
    notas: "Prestamo personal - 24.000 EUR - 18 EUR/mes gastos admin",
  },
  {
    id: 2,
    nombre: "Mesas",
    tipo: "cuotas",
    cuota: 49.5,
    interes_mensual: 0,
    cuotas_totales: 24,
    cuota_actual: 7,
    mes_inicio: "2025-11",
    notas: "nov 2025 a oct 2027",
  },
  {
    id: 3,
    nombre: "Poliza Sofi",
    tipo: "cuotas",
    cuota: 425.12,
    interes_mensual: 0,
    cuotas_totales: 3,
    cuota_actual: 2,
    mes_inicio: "2025-04",
    notas: "Queda 1 cuota",
  },
  {
    id: 4,
    nombre: "Cama",
    tipo: "cuotas",
    cuota: 273.9,
    interes_mensual: 0,
    cuotas_totales: 12,
    cuota_actual: 5,
    mes_inicio: "2025-11",
    notas: "nov 2025 a oct 2026 - quedan 7 pagos",
  },
];

export const DEMO_EVENTOS = [
  { id: 10, fecha: "2025-05-01", titulo: "Hipoteca", hora: "", categoria: "hogar", importe: 1275.36, notas: "Cuota mayo" },
  { id: 11, fecha: "2025-05-01", titulo: "Seguro de vida", hora: "", categoria: "hogar", importe: 103.15, notas: "" },
  { id: 12, fecha: "2025-05-01", titulo: "Seguro de hogar", hora: "", categoria: "hogar", importe: 44.11, notas: "" },
  { id: 13, fecha: "2025-05-01", titulo: "Comunidad", hora: "", categoria: "hogar", importe: 42, notas: "" },
  { id: 14, fecha: "2025-05-01", titulo: "Derramas", hora: "", categoria: "hogar", importe: 14, notas: "Mayo - importe reducido" },
  { id: 15, fecha: "2025-05-05", titulo: "Electricidad", hora: "", categoria: "hogar", importe: 52, notas: "Factura mayo" },
  { id: 16, fecha: "2025-05-05", titulo: "Gas", hora: "", categoria: "hogar", importe: 80, notas: "Factura mayo" },
  { id: 17, fecha: "2025-05-05", titulo: "Agua", hora: "", categoria: "hogar", importe: 50, notas: "" },
  { id: 18, fecha: "2025-05-05", titulo: "Internet + movil", hora: "", categoria: "transporte", importe: 43, notas: "" },
  { id: 19, fecha: "2025-05-01", titulo: "Gym Sofi", hora: "", categoria: "salud", importe: 45, notas: "Mensualidad" },
  { id: 20, fecha: "2025-05-01", titulo: "Compra coche", hora: "", categoria: "transporte", importe: 5500, notas: "Pago total - financiado con prestamo 1800 EUR" },
  { id: 21, fecha: "2025-05-01", titulo: "Devolucion IRPF Sofi", hora: "", categoria: "otro", importe: 310, notas: "Ingreso puntual - no recurrente" },
  { id: 30, fecha: "2025-06-01", titulo: "Devolucion prestamo coche", hora: "", categoria: "hogar", importe: 1800, notas: "Prestamo banco para pagar el auto" },
];

export const DEMO_VIAJES = [];

export const DEMO_PALANCAS = [
  { id: 1, nombre: "Habitacion fin de semana", subcategoria: "habitacion", importe: 70, mes: "2025-06", activa: false, notas: "1 fin de semana - pareja" },
  { id: 2, nombre: "Alquiler coche agosto", subcategoria: "coche", importe: 140, mes: "2025-08", activa: false, notas: "2 fines de semana" },
  { id: 3, nombre: "Venta bicicleta", subcategoria: "ventas", importe: 180, mes: "2025-07", activa: false, notas: "Bici de montana" },
  { id: 4, nombre: "Freelance Marqui", subcategoria: "otros", importe: 300, mes: "2025-09", activa: false, notas: "Proyecto puntual" },
];

export const DEMO_PROYECTOS = [
  { id: 200, habitacion: "huespedes", titulo: "Pintar paredes", descripcion: "Color crema calido", prioridad: "alta", estado: "pendiente", inicio: "2025-06-01", fin: "2025-06-07", presupuesto: 150, gasto: 0, notas: "" },
  { id: 201, habitacion: "salon", titulo: "Colgar cuadros", descripcion: "", prioridad: "media", estado: "pendiente", inicio: "2025-06-10", fin: "2025-06-10", presupuesto: 0, gasto: 0, notas: "" },
  { id: 202, habitacion: "cocina", titulo: "Instalar estantes", descripcion: "Estantes IKEA encima de la encimera", prioridad: "media", estado: "en_curso", inicio: "2025-05-20", fin: "2025-05-31", presupuesto: 80, gasto: 45, notas: "Faltan tornillos" },
  { id: 203, habitacion: "bano", titulo: "Cambiar grifo", descripcion: "", prioridad: "baja", estado: "pendiente", inicio: "2025-07-01", fin: "2025-07-03", presupuesto: 120, gasto: 0, notas: "" },
];

export const createInitialState = () => ({
  eventos: structuredClone(DEMO_EVENTOS),
  viajes: structuredClone(DEMO_VIAJES),
  bloqueos: [],
  proyectos: structuredClone(DEMO_PROYECTOS),
  palancas: structuredClone(DEMO_PALANCAS),
  deudas: structuredClone(DEMO_DEUDAS),
  suministros: [],
});