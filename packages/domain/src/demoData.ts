export const BASE = {
  "ingresos_fijos": 6653,
  "gastos_fijos": 2128.62,
  "deudas": 1150,
  "previsiones": 0,
  "presupuesto_variable": 285,
  "coste_coche": 5500,
  "detalle_fijos": [
    {
      "nombre": "Hipoteca",
      "importe": 1275.36
    },
    {
      "nombre": "Seguro de vida",
      "importe": 103.15
    },
    {
      "nombre": "Seguro de hogar",
      "importe": 44.11
    },
    {
      "nombre": "Comunidad",
      "importe": 42
    },
    {
      "nombre": "Derramas",
      "importe": 14
    },
    {
      "nombre": "Supermercado",
      "importe": 500
    },
    {
      "nombre": "Gym",
      "importe": 45
    },
    {
      "nombre": "Seguro auto",
      "importe": 50
    },
    {
      "nombre": "Transporte",
      "importe": 55
    }
  ],
  "detalle_ingresos": [
    {
      "nombre": "Sueldo Sofi",
      "importe": 2005,
      "recurrente": true
    },
    {
      "nombre": "Sueldo Marqui",
      "importe": 2048,
      "recurrente": true
    },
    {
      "nombre": "Sueldo Marqui 2",
      "importe": 2600,
      "recurrente": true,
      "desde": "abr"
    }
  ],
  "detalle_deudas": [
    {
      "nombre": "Marti / Tere",
      "importe": 1050
    },
    {
      "nombre": "Mesas",
      "importe": 70
    },
    {
      "nombre": "Cama",
      "importe": 30
    }
  ],
  "ingresos_puntuales_mayo": [
    {
      "nombre": "Devolucion IRPF Sofi",
      "importe": 310
    },
    {
      "nombre": "Adelanto de credito Sofi",
      "importe": 1800
    }
  ],
  "prestamo_coche": {
    "importe": 1800,
    "vence": "2026-06"
  },
  "monthlyOverrides": {
    "2026-01": {
      "fixedIncome": 4066,
      "fixedExpenses": 1564.62,
      "debtExpenses": 1150
    },
    "2026-02": {
      "fixedIncome": 3784,
      "fixedExpenses": 1729.62,
      "debtExpenses": 1150
    },
    "2026-03": {
      "fixedIncome": 0,
      "fixedExpenses": 0,
      "debtExpenses": 1150
    },
    "2026-04": {
      "fixedIncome": 9648,
      "fixedExpenses": 1729.62,
      "debtExpenses": 0
    },
    "2026-05": {
      "fixedIncome": 6653,
      "fixedExpenses": 1923.62,
      "debtExpenses": 1180
    },
    "2026-06": {
      "fixedIncome": 6685,
      "fixedExpenses": 1933.62,
      "debtExpenses": 1150
    },
    "2026-07": {
      "fixedIncome": 6653,
      "fixedExpenses": 2133.62,
      "debtExpenses": 1150
    },
    "2026-08": {
      "fixedIncome": 6653,
      "fixedExpenses": 2133.62,
      "debtExpenses": 1150
    },
    "2026-09": {
      "fixedIncome": 6653,
      "fixedExpenses": 2128.62,
      "debtExpenses": 1150
    },
    "2026-10": {
      "fixedIncome": 6653,
      "fixedExpenses": 2128.62,
      "debtExpenses": 1150
    },
    "2026-11": {
      "fixedIncome": 6653,
      "fixedExpenses": 2128.62,
      "debtExpenses": 1120
    },
    "2026-12": {
      "fixedIncome": 6653,
      "fixedExpenses": 2128.62,
      "debtExpenses": 1150
    }
  }
};

export const DEMO_DEUDAS = [
  {
    "id": 1,
    "nombre": "Marti / Tere",
    "tipo": "cuotas",
    "cuota": 1050,
    "interes_mensual": 0,
    "cuotas_totales": 12,
    "cuota_actual": 0,
    "mes_inicio": "2026-01",
    "notas": "Imported from Excel. April payment is planned as a future expense provision; May payment is 1080 in the monthly override."
  },
  {
    "id": 2,
    "nombre": "Mesas",
    "tipo": "cuotas",
    "cuota": 70,
    "interes_mensual": 0,
    "cuotas_totales": 12,
    "cuota_actual": 0,
    "mes_inicio": "2026-01",
    "notas": "Imported from Excel annual budget."
  },
  {
    "id": 3,
    "nombre": "Cama",
    "tipo": "cuotas",
    "cuota": 30,
    "interes_mensual": 0,
    "cuotas_totales": 12,
    "cuota_actual": 0,
    "mes_inicio": "2026-01",
    "notas": "Imported from Excel. November has no payment in the monthly override."
  }
];

export const DEMO_EVENTOS = [
  {
    "id": 1000,
    "fecha": "2026-01-05",
    "titulo": "Supermercado",
    "hora": "",
    "categoria": "hogar",
    "importe": 400,
    "notas": "Imported variable expense"
  },
  {
    "id": 1001,
    "fecha": "2026-01-05",
    "titulo": "GYM sofi",
    "hora": "",
    "categoria": "salud",
    "importe": 45,
    "notas": "Imported variable expense"
  },
  {
    "id": 1002,
    "fecha": "2026-01-05",
    "titulo": "Transporte",
    "hora": "",
    "categoria": "transporte",
    "importe": 55,
    "notas": "Imported variable expense"
  },
  {
    "id": 1003,
    "fecha": "2026-01-12",
    "titulo": "Ibi prorreateado",
    "hora": "",
    "categoria": "otro",
    "importe": 58.33,
    "notas": "Imported future expense provision"
  },
  {
    "id": 1004,
    "fecha": "2026-01-12",
    "titulo": "Poliza sofi Prorreateada",
    "hora": "",
    "categoria": "otro",
    "importe": 200,
    "notas": "Imported future expense provision"
  },
  {
    "id": 1005,
    "fecha": "2026-01-12",
    "titulo": "Poliza Marqui Prorreateada",
    "hora": "",
    "categoria": "otro",
    "importe": 125,
    "notas": "Imported future expense provision"
  },
  {
    "id": 1006,
    "fecha": "2026-01-20",
    "titulo": "Viaje Israel",
    "hora": "",
    "categoria": "viaje",
    "importe": 360,
    "notas": "Imported extraordinary expense"
  },
  {
    "id": 1007,
    "fecha": "2026-02-01",
    "titulo": "efectivo Disponible",
    "hora": "",
    "categoria": "ingreso",
    "importe": 56,
    "notas": "Imported from annual budget spreadsheet"
  },
  {
    "id": 1008,
    "fecha": "2026-02-05",
    "titulo": "Supermercado",
    "hora": "",
    "categoria": "hogar",
    "importe": 400,
    "notas": "Imported variable expense"
  },
  {
    "id": 1009,
    "fecha": "2026-03-12",
    "titulo": "Future expense provision",
    "hora": "",
    "categoria": "otro",
    "importe": 2300,
    "notas": "Balances imported annual summary"
  },
  {
    "id": 1010,
    "fecha": "2026-03-20",
    "titulo": "Taladro para fer",
    "hora": "",
    "categoria": "hogar",
    "importe": 39.98,
    "notas": "Imported extraordinary expense"
  },
  {
    "id": 1011,
    "fecha": "2026-03-20",
    "titulo": "Regalos Pitu y Pato",
    "hora": "",
    "categoria": "otro",
    "importe": 18,
    "notas": "Imported extraordinary expense"
  },
  {
    "id": 1012,
    "fecha": "2026-03-20",
    "titulo": "Cuota 1 poliza sofi",
    "hora": "",
    "categoria": "otro",
    "importe": 425.12,
    "notas": "Imported extraordinary expense"
  },
  {
    "id": 1013,
    "fecha": "2026-04-12",
    "titulo": "Marti Tere",
    "hora": "",
    "categoria": "otro",
    "importe": 1050,
    "notas": "Imported future expense provision"
  },
  {
    "id": 1014,
    "fecha": "2026-04-12",
    "titulo": "Mesas",
    "hora": "",
    "categoria": "otro",
    "importe": 70,
    "notas": "Imported future expense provision"
  },
  {
    "id": 1015,
    "fecha": "2026-04-12",
    "titulo": "Cama",
    "hora": "",
    "categoria": "otro",
    "importe": 30,
    "notas": "Imported future expense provision"
  },
  {
    "id": 1017,
    "fecha": "2026-04-20",
    "titulo": "Pasaje Etihad Air KIX-BCN",
    "hora": "",
    "categoria": "viaje",
    "importe": 362.12,
    "notas": "Imported extraordinary expense"
  },
  {
    "id": 1018,
    "fecha": "2026-04-20",
    "titulo": "Pasaje BCN- AMS",
    "hora": "",
    "categoria": "viaje",
    "importe": 36,
    "notas": "Imported extraordinary expense"
  },
  {
    "id": 1019,
    "fecha": "2026-04-20",
    "titulo": "Pasaje PVG-ICN",
    "hora": "",
    "categoria": "viaje",
    "importe": 61,
    "notas": "Imported extraordinary expense"
  },
  {
    "id": 1020,
    "fecha": "2026-04-20",
    "titulo": "Pasaje ICN-TPE",
    "hora": "",
    "categoria": "viaje",
    "importe": 84.15,
    "notas": "Imported extraordinary expense"
  },
  {
    "id": 1021,
    "fecha": "2026-04-20",
    "titulo": "Pasaje TPE-NRT",
    "hora": "",
    "categoria": "viaje",
    "importe": 97.94,
    "notas": "Imported extraordinary expense"
  },
  {
    "id": 1022,
    "fecha": "2026-04-20",
    "titulo": "Tren tokio-osaka",
    "hora": "",
    "categoria": "viaje",
    "importe": 151.42,
    "notas": "Imported extraordinary expense"
  },
  {
    "id": 1023,
    "fecha": "2026-04-20",
    "titulo": "Hotel Shanghai",
    "hora": "",
    "categoria": "viaje",
    "importe": 91.84,
    "notas": "Imported extraordinary expense"
  },
  {
    "id": 1024,
    "fecha": "2026-04-20",
    "titulo": "Hotel Seul",
    "hora": "",
    "categoria": "viaje",
    "importe": 115.45,
    "notas": "Imported extraordinary expense"
  },
  {
    "id": 1025,
    "fecha": "2026-04-20",
    "titulo": "Hotel Taipei",
    "hora": "",
    "categoria": "viaje",
    "importe": 28.62,
    "notas": "Imported extraordinary expense"
  },
  {
    "id": 1026,
    "fecha": "2026-04-20",
    "titulo": "Hotel osaka",
    "hora": "",
    "categoria": "viaje",
    "importe": 343.56,
    "notas": "Imported extraordinary expense"
  },
  {
    "id": 1027,
    "fecha": "2026-04-20",
    "titulo": "Hotel tokio",
    "hora": "",
    "categoria": "viaje",
    "importe": 276.88,
    "notas": "Imported extraordinary expense"
  },
  {
    "id": 1028,
    "fecha": "2026-04-20",
    "titulo": "Airalo",
    "hora": "",
    "categoria": "viaje",
    "importe": 41.5,
    "notas": "Imported extraordinary expense"
  },
  {
    "id": 1029,
    "fecha": "2026-04-20",
    "titulo": "Transferencias revolut para Gastos viaje",
    "hora": "",
    "categoria": "viaje",
    "importe": 1160.06,
    "notas": "Imported extraordinary expense"
  },
  {
    "id": 1030,
    "fecha": "2026-04-20",
    "titulo": "Cuota 2 poliza sofi",
    "hora": "",
    "categoria": "otro",
    "importe": 425.12,
    "notas": "Imported extraordinary expense"
  },
  {
    "id": 1031,
    "fecha": "2026-05-01",
    "titulo": "Devolucion IRPF sofi",
    "hora": "",
    "categoria": "ingreso",
    "importe": 310,
    "notas": "Imported from annual budget spreadsheet"
  },
  {
    "id": 1032,
    "fecha": "2026-05-01",
    "titulo": "Adelanto de credito sofi",
    "hora": "",
    "categoria": "ingreso",
    "importe": 1800,
    "notas": "Imported from annual budget spreadsheet"
  },
  {
    "id": 1033,
    "fecha": "2026-05-20",
    "titulo": "Auto",
    "hora": "",
    "categoria": "transporte",
    "importe": 5500,
    "notas": "Imported extraordinary expense"
  },
  {
    "id": 1034,
    "fecha": "2026-06-01",
    "titulo": "Ingreso habitacion",
    "hora": "",
    "categoria": "habitacion",
    "importe": 280,
    "notas": "Imported from annual budget spreadsheet"
  },
  {
    "id": 1035,
    "fecha": "2026-06-20",
    "titulo": "cuota poliza",
    "hora": "",
    "categoria": "otro",
    "importe": 425,
    "notas": "Imported extraordinary expense"
  },
  {
    "id": 1036,
    "fecha": "2026-06-20",
    "titulo": "Devolucion adelanto",
    "hora": "",
    "categoria": "otro",
    "importe": 1000,
    "notas": "Imported extraordinary expense"
  },
  {
    "id": 1037,
    "fecha": "2026-06-20",
    "titulo": "Tarjeta mes pasado",
    "hora": "",
    "categoria": "otro",
    "importe": 770.04,
    "notas": "Imported extraordinary expense"
  },
  {
    "id": 1038,
    "fecha": "2026-06-20",
    "titulo": "prestamo",
    "hora": "",
    "categoria": "otro",
    "importe": 800,
    "notas": "Imported extraordinary expense"
  },
  {
    "id": 1039,
    "fecha": "2026-06-20",
    "titulo": "ginebra",
    "hora": "",
    "categoria": "salud",
    "importe": 106,
    "notas": "Imported extraordinary expense"
  },
  {
    "id": 1040,
    "fecha": "2026-07-20",
    "titulo": "Casamiento Marqui",
    "hora": "",
    "categoria": "otro",
    "importe": 200,
    "notas": "Imported extraordinary expense"
  },
  {
    "id": 1041,
    "fecha": "2026-07-20",
    "titulo": "Ibiza",
    "hora": "",
    "categoria": "viaje",
    "importe": 1000,
    "notas": "Imported extraordinary expense"
  },
  {
    "id": 1042,
    "fecha": "2026-07-20",
    "titulo": "Macía",
    "hora": "",
    "categoria": "otro",
    "importe": 200,
    "notas": "Imported extraordinary expense"
  },
  {
    "id": 1043,
    "fecha": "2026-07-20",
    "titulo": "mampara",
    "hora": "",
    "categoria": "hogar",
    "importe": 121,
    "notas": "Imported extraordinary expense"
  },
  {
    "id": 1044,
    "fecha": "2026-07-20",
    "titulo": "ventiladores",
    "hora": "",
    "categoria": "hogar",
    "importe": 168,
    "notas": "Imported extraordinary expense"
  },
  {
    "id": 1045,
    "fecha": "2026-07-20",
    "titulo": "Padel surf + carpa + toallas",
    "hora": "",
    "categoria": "ocio",
    "importe": 380,
    "notas": "Imported extraordinary expense"
  },
  {
    "id": 1046,
    "fecha": "2026-08-12",
    "titulo": "IRPF Marcos",
    "hora": "",
    "categoria": "otro",
    "importe": 700,
    "notas": "Imported future expense provision"
  },
  {
    "id": 1047,
    "fecha": "2026-08-20",
    "titulo": "Dinamarca",
    "hora": "",
    "categoria": "viaje",
    "importe": 400,
    "notas": "Imported extraordinary expense"
  },
  {
    "id": 1048,
    "fecha": "2026-09-05",
    "titulo": "Nafta",
    "hora": "",
    "categoria": "transporte",
    "importe": 60,
    "notas": "Imported variable expense"
  },
  {
    "id": 1049,
    "fecha": "2026-09-20",
    "titulo": "Poliza sofi",
    "hora": "",
    "categoria": "otro",
    "importe": 2400,
    "notas": "Imported extraordinary expense"
  },
  {
    "id": 1050,
    "fecha": "2026-10-05",
    "titulo": "Nafta",
    "hora": "",
    "categoria": "transporte",
    "importe": 60,
    "notas": "Imported variable expense"
  },
  {
    "id": 1051,
    "fecha": "2026-10-20",
    "titulo": "Amortizacion 1 cuota",
    "hora": "",
    "categoria": "otro",
    "importe": 700,
    "notas": "Imported extraordinary expense"
  },
  {
    "id": 1052,
    "fecha": "2026-11-05",
    "titulo": "Nafta",
    "hora": "",
    "categoria": "transporte",
    "importe": 60,
    "notas": "Imported variable expense"
  },
  {
    "id": 1053,
    "fecha": "2026-12-05",
    "titulo": "Nafta",
    "hora": "",
    "categoria": "transporte",
    "importe": 60,
    "notas": "Imported variable expense"
  },
  {
    "id": 1054,
    "fecha": "2026-12-20",
    "titulo": "Viaje Argentina",
    "hora": "",
    "categoria": "viaje",
    "importe": 500,
    "notas": "Imported extraordinary expense"
  }
];

export const DEMO_VIAJES = [];

export const DEMO_PALANCAS = [
  {
    "id": 1,
    "nombre": "Habitacion fin de semana",
    "subcategoria": "habitacion",
    "importe": 70,
    "mes": "2026-06",
    "activa": false,
    "notas": "1 fin de semana - pareja"
  },
  {
    "id": 2,
    "nombre": "Alquiler coche agosto",
    "subcategoria": "coche",
    "importe": 140,
    "mes": "2026-08",
    "activa": false,
    "notas": "2 fines de semana"
  },
  {
    "id": 3,
    "nombre": "Venta bicicleta",
    "subcategoria": "ventas",
    "importe": 180,
    "mes": "2026-07",
    "activa": false,
    "notas": "Bici de montana"
  },
  {
    "id": 4,
    "nombre": "Freelance Marqui",
    "subcategoria": "otros",
    "importe": 300,
    "mes": "2026-09",
    "activa": false,
    "notas": "Proyecto puntual"
  }
];

export const DEMO_PROYECTOS = [
  {
    "id": 200,
    "habitacion": "huespedes",
    "titulo": "Pintar paredes",
    "descripcion": "Color crema calido",
    "prioridad": "alta",
    "estado": "pendiente",
    "inicio": "2026-06-01",
    "fin": "2026-06-07",
    "presupuesto": 150,
    "gasto": 0,
    "notas": ""
  },
  {
    "id": 201,
    "habitacion": "salon",
    "titulo": "Colgar cuadros",
    "descripcion": "",
    "prioridad": "media",
    "estado": "pendiente",
    "inicio": "2026-06-10",
    "fin": "2026-06-10",
    "presupuesto": 0,
    "gasto": 0,
    "notas": ""
  },
  {
    "id": 202,
    "habitacion": "cocina",
    "titulo": "Instalar estantes",
    "descripcion": "Estantes IKEA encima de la encimera",
    "prioridad": "media",
    "estado": "en_curso",
    "inicio": "2026-05-20",
    "fin": "2026-05-31",
    "presupuesto": 80,
    "gasto": 45,
    "notas": "Faltan tornillos"
  },
  {
    "id": 203,
    "habitacion": "bano",
    "titulo": "Cambiar grifo",
    "descripcion": "",
    "prioridad": "baja",
    "estado": "pendiente",
    "inicio": "2026-07-01",
    "fin": "2026-07-03",
    "presupuesto": 120,
    "gasto": 0,
    "notas": ""
  }
];

export const DEMO_SUMINISTROS = [
  {
    "id": 3000,
    "mes": "2026-01",
    "tipo": "luz",
    "importe": 82.83,
    "notas": "Energia electrica"
  },
  {
    "id": 3001,
    "mes": "2026-01",
    "tipo": "agua",
    "importe": 50,
    "notas": "Agua"
  },
  {
    "id": 3002,
    "mes": "2026-01",
    "tipo": "internet",
    "importe": 43,
    "notas": "Internet + móvil"
  },
  {
    "id": 3003,
    "mes": "2026-02",
    "tipo": "luz",
    "importe": 82.83,
    "notas": "Energia electrica"
  },
  {
    "id": 3004,
    "mes": "2026-02",
    "tipo": "agua",
    "importe": 50,
    "notas": "Agua"
  },
  {
    "id": 3005,
    "mes": "2026-02",
    "tipo": "internet",
    "importe": 43,
    "notas": "Internet + móvil"
  },
  {
    "id": 3006,
    "mes": "2026-04",
    "tipo": "luz",
    "importe": 52,
    "notas": "Energia electrica"
  },
  {
    "id": 3007,
    "mes": "2026-04",
    "tipo": "gas",
    "importe": 80,
    "notas": "Gas"
  },
  {
    "id": 3008,
    "mes": "2026-04",
    "tipo": "agua",
    "importe": 50,
    "notas": "Agua"
  },
  {
    "id": 3009,
    "mes": "2026-04",
    "tipo": "internet",
    "importe": 43,
    "notas": "Internet + móvil"
  },
  {
    "id": 3010,
    "mes": "2026-05",
    "tipo": "luz",
    "importe": 52,
    "notas": "Energia electrica"
  },
  {
    "id": 3011,
    "mes": "2026-05",
    "tipo": "gas",
    "importe": 80,
    "notas": "Gas"
  },
  {
    "id": 3012,
    "mes": "2026-05",
    "tipo": "agua",
    "importe": 50,
    "notas": "Agua"
  },
  {
    "id": 3013,
    "mes": "2026-05",
    "tipo": "internet",
    "importe": 43,
    "notas": "Internet + móvil"
  },
  {
    "id": 3014,
    "mes": "2026-06",
    "tipo": "luz",
    "importe": 52,
    "notas": "Energia electrica"
  },
  {
    "id": 3015,
    "mes": "2026-06",
    "tipo": "gas",
    "importe": 47.76,
    "notas": "Gas"
  },
  {
    "id": 3016,
    "mes": "2026-06",
    "tipo": "agua",
    "importe": 73.33,
    "notas": "Agua"
  },
  {
    "id": 3017,
    "mes": "2026-06",
    "tipo": "internet",
    "importe": 43,
    "notas": "Internet + móvil"
  },
  {
    "id": 3018,
    "mes": "2026-07",
    "tipo": "luz",
    "importe": 80,
    "notas": "Energia electrica"
  },
  {
    "id": 3019,
    "mes": "2026-07",
    "tipo": "gas",
    "importe": 47,
    "notas": "Gas"
  },
  {
    "id": 3020,
    "mes": "2026-07",
    "tipo": "agua",
    "importe": 50,
    "notas": "Agua"
  },
  {
    "id": 3021,
    "mes": "2026-07",
    "tipo": "internet",
    "importe": 43,
    "notas": "Internet + móvil"
  },
  {
    "id": 3022,
    "mes": "2026-08",
    "tipo": "luz",
    "importe": 80,
    "notas": "Energia electrica"
  },
  {
    "id": 3023,
    "mes": "2026-08",
    "tipo": "gas",
    "importe": 80,
    "notas": "Gas"
  },
  {
    "id": 3024,
    "mes": "2026-08",
    "tipo": "agua",
    "importe": 50,
    "notas": "Agua"
  },
  {
    "id": 3025,
    "mes": "2026-08",
    "tipo": "internet",
    "importe": 43,
    "notas": "Internet + móvil"
  },
  {
    "id": 3026,
    "mes": "2026-09",
    "tipo": "luz",
    "importe": 80,
    "notas": "Energia electrica"
  },
  {
    "id": 3027,
    "mes": "2026-09",
    "tipo": "gas",
    "importe": 80,
    "notas": "Gas"
  },
  {
    "id": 3028,
    "mes": "2026-09",
    "tipo": "agua",
    "importe": 50,
    "notas": "Agua"
  },
  {
    "id": 3029,
    "mes": "2026-09",
    "tipo": "internet",
    "importe": 43,
    "notas": "Internet + móvil"
  },
  {
    "id": 3030,
    "mes": "2026-10",
    "tipo": "luz",
    "importe": 52,
    "notas": "Energia electrica"
  },
  {
    "id": 3031,
    "mes": "2026-10",
    "tipo": "gas",
    "importe": 80,
    "notas": "Gas"
  },
  {
    "id": 3032,
    "mes": "2026-10",
    "tipo": "agua",
    "importe": 50,
    "notas": "Agua"
  },
  {
    "id": 3033,
    "mes": "2026-10",
    "tipo": "internet",
    "importe": 43,
    "notas": "Internet + móvil"
  },
  {
    "id": 3034,
    "mes": "2026-11",
    "tipo": "luz",
    "importe": 80,
    "notas": "Energia electrica"
  },
  {
    "id": 3035,
    "mes": "2026-11",
    "tipo": "gas",
    "importe": 80,
    "notas": "Gas"
  },
  {
    "id": 3036,
    "mes": "2026-11",
    "tipo": "agua",
    "importe": 50,
    "notas": "Agua"
  },
  {
    "id": 3037,
    "mes": "2026-11",
    "tipo": "internet",
    "importe": 43,
    "notas": "Internet + móvil"
  },
  {
    "id": 3038,
    "mes": "2026-12",
    "tipo": "luz",
    "importe": 52,
    "notas": "Energia electrica"
  },
  {
    "id": 3039,
    "mes": "2026-12",
    "tipo": "gas",
    "importe": 80,
    "notas": "Gas"
  },
  {
    "id": 3040,
    "mes": "2026-12",
    "tipo": "agua",
    "importe": 50,
    "notas": "Agua"
  },
  {
    "id": 3041,
    "mes": "2026-12",
    "tipo": "internet",
    "importe": 43,
    "notas": "Internet + móvil"
  }
];

export const createInitialState = () => ({
  configuracion: [structuredClone({ ...BASE, id: "base" })],
  eventos: structuredClone(DEMO_EVENTOS),
  viajes: structuredClone(DEMO_VIAJES),
  bloqueos: [],
  proyectos: structuredClone(DEMO_PROYECTOS),
  palancas: structuredClone(DEMO_PALANCAS),
  deudas: structuredClone(DEMO_DEUDAS),
  suministros: structuredClone(DEMO_SUMINISTROS),
  gastosVariables: [],
});
