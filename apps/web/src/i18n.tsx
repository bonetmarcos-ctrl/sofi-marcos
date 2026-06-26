/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Language = "en" | "es" | "ca";

type LanguageOption = {
  code: Language;
  label: string;
  shortLabel: string;
};

type LanguageContextValue = {
  language: Language;
  languages: LanguageOption[];
  setLanguage: (language: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  monthName: (index: number, format?: "long" | "short") => string;
  weekdayName: (index: number) => string;
};

const STORAGE_KEY = "sofi_marqui_language";

export const languages: LanguageOption[] = [
  { code: "en", label: "English", shortLabel: "EN" },
  { code: "es", label: "Español", shortLabel: "ES" },
  { code: "ca", label: "Català", shortLabel: "CA" },
];

const monthNames: Record<Language, { long: string[]; short: string[]; weekdays: string[] }> = {
  en: {
    long: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    short: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
  },
  es: {
    long: ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"],
    short: ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"],
    weekdays: ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"],
  },
  ca: {
    long: ["Gener", "Febrer", "Març", "Abril", "Maig", "Juny", "Juliol", "Agost", "Setembre", "Octubre", "Novembre", "Desembre"],
    short: ["Gen", "Feb", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Oct", "Nov", "Des"],
    weekdays: ["Dl", "Dt", "Dc", "Dj", "Dv", "Ds", "Dg"],
  },
};

const translations: Record<Language, Record<string, string>> = {
  en: {
    Language: "Language",
    Budget: "Budget",
    Calendar: "Calendar",
    Home: "Home",
    "Add event": "Add event",
    "Add trip": "Add trip",
    Logout: "Logout",
    "Synced with API": "Synced with API",
    "Local mode": "Local mode",
    Loading: "Loading",
    Login: "Login",
    "Create account": "Create account",
    "Private access": "Private access",
    "Application name": "Application name",
    Username: "Username",
    Password: "Password",
    "Logging in...": "Logging in...",
    "Creating...": "Creating...",
    "Could not create the account": "Could not create the account",
    "Could not log in": "Could not log in",
    "Fixed income": "Fixed income", "Previous card balance": "Previous card balance",
    "Variable income": "Variable income",
    "Inactive potential": "Inactive potential",
    "Fixed expenses": "Fixed expenses",
    "Financial pressure": "Financial pressure",
    "Outstanding debt": "Outstanding debt",
    "Monthly summary": "Monthly summary",
    "Income · expenses · debt snapshot": "Income · expenses · debt snapshot",
    "Monthly adjustment": "Monthly adjustment",
    "guaranteed monthly": "guaranteed monthly",
    "year to date": "year to date",
    "monthly structure": "monthly structure",
    "of committed income": "of committed income",
    "Next payoff": "Next payoff",
    "Income structure": "INCOME",
    "Guaranteed fixed · Recorded variable · Activatable potential": "Guaranteed fixed · Recorded variable · Activatable potential",
    "Monthly total": "Monthly total",
    "This month total": "This month total",
    "Levers": "Levers",
    "New": "New",
    "No levers yet": "No levers yet",
    Active: "Active",
    Activate: "Activate",
    "Monthly variable expenses": "EXPENSES",
    "Utilities · Discretionary · Trips": "Utilities · Discretionary · Trips",
    "this month": "this month",
    "Fixed costs": "Fixed costs",
    Utilities: "Utilities",
    Discretionary: "Discretionary",
    Trips: "Trips",
    "No calendar expenses": "No calendar expenses",
    "No trips this month": "No trips this month",
    "Layered expenses": "Layered expenses",
    "Hover each bar · future months are gray estimates": "Hover each bar · future months are gray estimates",
    Structural: "Structural",
    "Total income": "Total income",
    Balance: "Balance",
    estimated: "estimated",
    "Active levers": "Active levers",
    Pressure: "Pressure",
    "Variable expenses by category": "Variable expenses by category",
    "Edit utility bill": "Edit utility bill",
    Provider: "Provider",
    "Provider name": "Provider name",
    "Billing frequency": "Billing frequency",
    Consumption: "Consumption",
    Unit: "Unit",
    "Billing period": "Billing period",
    Monthly: "Monthly",
    Bimonthly: "Bimonthly",
    Quarterly: "Quarterly",
    Annual: "Annual",
    "One-off": "One-off",
    "Cash flow month": "Cash flow month",
    "Save utility bill": "Save utility bill",
    "Expense explorer": "Expense explorer",
    "Monthly evolution": "Monthly evolution",
    "No utility data": "No utility data",
    "No records": "No records",
    "Selected month": "Selected month",
    "Annual total": "Annual total",
    Average: "Average", "Financial pressure analyzer": "Financial pressure analyzer", "Committed structure · income stress test": "Committed structure · income stress test", "Committed spending": "Committed spending", "of spending": "of spending", "Minimum income for current lifestyle": "Minimum income for current lifestyle", "all monthly spending": "all monthly spending", "Income drop room": "Income drop room", "before deficit": "before deficit", "Expense commitment": "Expense commitment", "Fixed income covers essentials": "Fixed income covers essentials", "Fixed income does not cover essentials": "Fixed income does not cover essentials", "Minimum income for essentials": "Minimum income for essentials", "Lifestyle needs a buffer": "Lifestyle needs a buffer", "Lifestyle is sustainable at current income": "Lifestyle is sustainable at current income", "Lifestyle is tight under lower income": "Lifestyle is tight under lower income", "Stress test with lower income": "Stress test with lower income", "Current income": "Current income", "Only fixed income": "Only fixed income", "Maintains current lifestyle": "Maintains current lifestyle", "Surplus {amount}": "Surplus {amount}", "Needs lifestyle adjustment": "Needs lifestyle adjustment", "Cut {amount}": "Cut {amount}", "Structural gap": "Structural gap", "Fixed-only balance": "Fixed-only balance",
    "Debt panel": "Debt panel",
    "This month's payment": "This month's payment",
    "balance impact": "balance impact",
    "Active debts": "Active debts",
    "Global repayment progress": "Global repayment progress",
    "No debts registered": "No debts registered",
    "Paid off": "Paid off",
    "This month!": "This month!",
    month: "month",
    months: "months",
    "Paid principal": "Paid principal",
    "Paid interest": "Paid interest",
    "Total impact": "Total impact",
    Paid: "Paid",
    Close: "Close",
    "to free": "to free",
    Debt: "Debt",
    debts: "debts",
    "capital + interest": "capital + interest",
    "/month": "/month",
    "Income freed without debt": "Income freed without debt",
    "Monthly debt-free projection": "Monthly debt-free projection",
    "Month-by-month payment release · impact on free balance": "Month-by-month payment release · impact on free balance",
    "Free balance today": "Free balance today",
    "Free balance without debt": "Free balance without debt",
    "Total released": "Total released",
    "with all payments active": "with all payments active",
    "once everything is paid off": "once everything is paid off",
    "per month when finished": "per month when finished",
    Month: "Month",
    Week: "Week",
    more: "more",
    Payments: "Payments",
    "Free balance": "Free balance",
    last: "last",
    pending: "pending",
    "final payment": "final payment",
    "is released": "is released",
    "per month": "per month",
    "Block room": "Block room",
    "Block car": "Block car",
    Occupied: "Occupied",
    From: "From",
    To: "To",
    Note: "Note",
    "Guests, reason...": "Guests, reason...",
    nights: "nights",
    night: "night",
    "Save block": "Save block",
    "Start time": "Start time",
    "End time": "End time",
    "Monthly free balance": "Monthly free balance",
    Extras: "Extras",
    Variable: "Variable",
    "By category": "By category",
    "Expenses by category and funding": "Expenses by category and funding",
    record: "record",
    records: "records",
    Birthdays: "Birthdays",
    saved: "saved",
    "No birthdays saved": "No birthdays saved",
    days: "days",
    "Add birthday": "Add birthday",
    "Supermarket purchases": "Supermarket purchases",
    Store: "Store",
    Product: "Product",
    "Add product": "Add product",
    "Save supermarket purchase": "Save supermarket purchase",
    "products tracked": "products tracked",
    "Car ROI": "Car ROI",
    of: "of",
    "Edit event": "Edit event",
    "New event": "New event",
    Type: "Type",
    "Who is it for?": "Who is it for?",
    "Booking details": "Booking details",
    Guests: "Guests",
    "Example guests": "E.g. Marc & Sofia",
    Nights: "Nights",
    "per night": "per night",
    single: "single",
    couple: "couple",
    "family/free": "family/free",
    Total: "Total",
    "Car rental": "Car rental",
    Days: "Days",
    Net: "Net",
    Description: "Description",
    "What is it?": "What is it?",
    Date: "Date",
    Time: "Time",
    "Amount (€)": "Amount (€)",
    "Funding source": "Funding source",
    Card: "Card",
    "Card name": "Card name",
    "Card closing day": "Card closing day",
    "Invoice date": "Invoice date",
    "Due date": "Due date",
    "Money available date": "Money available date",
    "Money needed": "Money needed",
    "Real pressure": "Real pressure",
    "Purchase month": "Purchase month",
    "Monthly income": "Monthly income",
    "Credit card next month": "Credit card next month",
    "Credit card installments": "Credit card installments",
    "Debit month": "Debit month",
    "First debit month": "First debit month",
    Installments: "Installments",
    Notes: "Notes",
    "Details...": "Details...",
    "Extra income": "Extra income",
    "Variable expense": "Variable expense",
    "Edit expense": "Edit expense",
    "Save expense": "Save expense",
    "Save changes": "Save changes",
    "Save event": "Save event",
    Delete: "Delete",
    "Delete this event?": "Delete this event?",
    "Want to add a trip? Use the Add trip button in the main menu.": "Want to add a trip? Use the Add trip button in the main menu.",
    "Edit trip": "Edit trip",
    "New trip": "New trip",
    Name: "Name",
    "Rome, Paris...": "Rome, Paris...",
    Departure: "Departure",
    Return: "Return",
    "Total budget (€)": "Total budget (€)",
    Color: "Color",
    "Expense breakdown": "Expense breakdown",
    Remaining: "Remaining",
    Exceeded: "Exceeded",
    "of budget": "of budget",
    "Save trip": "Save trip",
    "Edit lever": "Edit lever",
    "New lever": "New lever",
    Subcategory: "Subcategory",
    "Example lever": "E.g. August car rental",
    "Estimated amount (€)": "Estimated amount (€)",
    "Context or conditions...": "Context or conditions...",
    "When this lever is active, {amount} is added to variable income for {month}": "When this lever is active, {amount} is added to variable income for {month}",
    "Save lever": "Save lever",
    "Edit debt": "Edit debt",
    "New debt": "New debt",
    "Name / Creditor": "Name / Creditor",
    "Monthly payment (€)": "Monthly payment (€)",
    "Monthly interest / fee (€)": "Monthly interest / fee (€)",
    "Total payments": "Total payments",
    "Paid payments": "Paid payments",
    "First payment month": "First payment month",
    "Calculated summary": "Calculated summary",
    "Outstanding principal": "Outstanding principal",
    "Interest cost": "Interest cost",
    "Monthly impact": "Monthly impact",
    "Estimated finish date": "Estimated finish date",
    Progress: "Progress",
    "Save debt": "Save debt",
    "Total tasks": "Total tasks",
    completed: "completed",
    "In progress": "In progress",
    Budgeted: "Budgeted",
    Spent: "Spent",
    List: "List",
    All: "All",
    Task: "Task",
    "No tasks. Add the first one!": "No tasks. Add the first one!",
    "No tasks": "No tasks",
    "Edit task": "Edit task",
    "New task": "New task",
    Room: "Room",
    Title: "Title",
    "Example task": "E.g. Paint walls",
    Priority: "Priority",
    Status: "Status",
    Start: "Start",
    End: "End",
    "Spent (€)": "Spent (€)",
    "spent": "spent",
    "Observations...": "Observations...",
    "Create task": "Create task",
    "Delete this task?": "Delete this task?",
    Restaurant: "Restaurant",
    Transport: "Transport",
    Clothes: "Clothes",
    Trip: "Trip",
    Both: "Both",
    Flight: "Flight",
    Activities: "Activities",
    "Guest room": "Guest room",
    Entry: "Entry",
    Income: "Income",
    "Car": "Car",
    "Sales": "Sales",
    "Other": "Other",
    "Supermarket": "Supermarket",
    "Housing": "Housing",
    "Food": "Food",
    "Leisure": "Leisure",
    "Health": "Health",
    "Utility bills": "Utility bills",
    "Mobile": "Mobile",
    "Water": "Water",
    "Power": "Power",
    "Gas": "Gas",
    "Internet": "Internet",
    "Living room": "Living room",
    "Kitchen": "Kitchen",
    "Bedroom": "Bedroom",
    "Bathroom": "Bathroom",
    "Terrace": "Terrace",
    "Low": "Low",
    "Medium": "Medium",
    "High": "High",
    "Pending": "Pending",
    "Blocked": "Blocked",
    "Done": "Done",
  },
  es: {
    Language: "Idioma", Budget: "Presupuesto", Calendar: "Calendario", Home: "Casa", "Add event": "+ Evento", "Add trip": "Viaje", Logout: "Salir", "Synced with API": "Sincronizado con API", "Local mode": "Modo local", Loading: "Cargando", Login: "Entrar", "Create account": "Crear cuenta", "Private access": "Acceso privado", "Application name": "Nombre de la aplicación", Username: "Usuario", Password: "Contraseña", "Logging in...": "Entrando...", "Creating...": "Creando...", "Could not create the account": "No se pudo crear la cuenta", "Could not log in": "No se pudo iniciar sesión",
    "Fixed income": "Ingresos fijos", "Previous card balance": "Saldo tarjeta mes anterior", "Variable income": "Ingresos variables", "Inactive potential": "Potencial sin activar", "Fixed expenses": "Gastos fijos", "Financial pressure": "Presión financiera", "Outstanding debt": "Deuda pendiente", "Monthly summary": "Resumen mensual", "Income · expenses · debt snapshot": "Ingresos · gastos · deuda", "Monthly adjustment": "Ajuste mensual", "guaranteed monthly": "mensual garantizado", "year to date": "acumulado", "monthly structure": "estructura mensual", "of committed income": "del ingreso comprometido", "Next payoff": "Próx. fin", "Income structure": "INGRESOS", "Guaranteed fixed · Recorded variable · Activatable potential": "Fijos garantizados · Variables registrados · Potencial activable", "Monthly total": "Total mensual", "This month total": "Total este mes", Levers: "Palancas", New: "Nueva", "No levers yet": "Sin palancas aún", Active: "Activa", Activate: "Activar",
    "Monthly variable expenses": "GASTOS", "Utilities · Discretionary · Trips": "Suministros · Discrecional · Viajes", "this month": "este mes", "Fixed costs": "Gastos fijos", Utilities: "Suministros", Discretionary: "Discrecional", Trips: "Viajes", "No calendar expenses": "Sin gastos en el calendario", "No trips this month": "Sin viajes este mes", "Layered expenses": "Gastos por capa", "Hover each bar · future months are gray estimates": "Pasá el mouse sobre cada barra · futuro en gris estimado", Structural: "Estructural", "Total income": "Ingresos totales", Balance: "Saldo", estimated: "estimado", "Active levers": "Palancas activas", Pressure: "Presión", "Variable expenses by category": "Gastos variables por categoría", "Edit utility bill": "Editar suministro", Provider: "Proveedor", "Provider name": "Nombre del proveedor", "Billing frequency": "Frecuencia de factura", Consumption: "Consumo", Unit: "Unidad", "Billing period": "Periodo facturado", Monthly: "Mensual", Bimonthly: "Bimestral", Quarterly: "Trimestral", Annual: "Anual", "One-off": "Puntual", "Cash flow month": "Mes de pago", "Save utility bill": "Guardar suministro", "Expense explorer": "Explorador de gastos", "Monthly evolution": "Evolución mensual", "No utility data": "Sin datos de suministros", "No records": "Sin registros", "Selected month": "Mes seleccionado", "Annual total": "Total anual", Average: "Promedio", "Financial pressure analyzer": "Analizador de presión financiera", "Committed structure · income stress test": "Estructura comprometida · prueba de ingresos", "Committed spending": "Gasto comprometido", "of spending": "del gasto", "Minimum income for current lifestyle": "Ingreso mínimo para nivel actual", "all monthly spending": "todo el gasto mensual", "Income drop room": "Margen de caída de ingresos", "before deficit": "antes de déficit", "Expense commitment": "Compromiso del gasto", "Fixed income covers essentials": "Los ingresos fijos cubren lo esencial", "Fixed income does not cover essentials": "Los ingresos fijos no cubren lo esencial", "Minimum income for essentials": "Ingreso mínimo para esenciales", "Lifestyle needs a buffer": "El nivel de vida necesita margen", "Lifestyle is sustainable at current income": "El nivel de vida es sostenible con el ingreso actual", "Lifestyle is tight under lower income": "El nivel de vida va justo con menos ingresos", "Stress test with lower income": "Prueba con menos ingresos", "Current income": "Ingreso actual", "Only fixed income": "Solo ingresos fijos", "Maintains current lifestyle": "Mantiene el nivel actual", "Surplus {amount}": "Sobran {amount}", "Needs lifestyle adjustment": "Requiere ajustar nivel de vida", "Cut {amount}": "Recortar {amount}", "Structural gap": "Brecha estructural", "Fixed-only balance": "Saldo solo con ingresos fijos",
    Debt: "Deudas", debts: "deudas", "Debt panel": "Deudas", "This month's payment": "Cuota este mes", "balance impact": "impacto en saldo", "Active debts": "Deudas activas", "Global repayment progress": "Progreso global de amortización", "No debts registered": "Sin deudas registradas", "Paid off": "Saldada", "This month!": "¡Este mes!", month: "mes", months: "meses", "Paid principal": "Capital pagado", "Paid interest": "Intereses pagados", "Total impact": "Impacto total", Paid: "Pagada", Close: "Cerrar", "to free": "para liberar", "capital + interest": "capital + intereses", "/month": "/mes", "Income freed without debt": "Se liberan en total", "Monthly debt-free projection": "Proyección sin deudas", "Month-by-month payment release · impact on free balance": "Liberación de cuotas mes a mes · impacto en saldo libre", "Free balance today": "Saldo libre hoy", "Free balance without debt": "Saldo libre sin deudas", "Total released": "Se liberan en total", "with all payments active": "con todas las cuotas activas", "once everything is paid off": "cuando estén todas saldadas", "per month when finished": "€/mes cuando acaben", Month: "Mes", Payments: "Cuotas", "Free balance": "Saldo libre", last: "última", pending: "pend.", "final payment": "última cuota", "is released": "se liberan", "per month": "mes",
    "Block room": "Bloquear habitación", "Block car": "Bloquear coche", Occupied: "Ocupada", From: "Desde", To: "Hasta", Note: "Nota", "Guests, reason...": "Huéspedes, motivo...", nights: "noches", night: "noche", "Save block": "Guardar bloqueo", "Start time": "Hora inicio", "End time": "Hora fin", "Monthly free balance": "saldo libre del mes", Extras: "Extras", Variable: "Variable", "By category": "Por categoría", "Expenses by category and funding": "Gasto por categoría y origen", record: "registro", records: "registros", Birthdays: "Cumpleaños", saved: "guardados", "No birthdays saved": "Sin cumpleaños guardados", days: "días", "Add birthday": "Agregar cumpleaños", "Supermarket purchases": "Compras del súper", Store: "Tienda", Product: "Producto", "Add product": "Agregar producto", "Save supermarket purchase": "Guardar compra del súper", "products tracked": "productos cargados", "Car ROI": "ROI Coche", of: "de",
    "Edit event": "Editar evento", "New event": "Nuevo evento", Type: "Tipo", "Who is it for?": "¿De quién?", "Booking details": "Datos de la reserva", Guests: "Huéspedes", "Example guests": "Ej: Marc & Sofía", Nights: "Noches", "per night": "€/noche", single: "individual", couple: "pareja", "family/free": "familia/gratis", Total: "Total", "Car rental": "Alquiler coche", Days: "Días", Net: "Neto", Description: "Descripción", "What is it?": "¿Qué es?", Date: "Fecha", Time: "Hora", "Amount (€)": "Importe (€)", "Funding source": "Origen de fondos", Card: "Tarjeta", "Card name": "Nombre de tarjeta", "Card closing day": "Día de cierre", "Invoice date": "Fecha factura", "Due date": "Vencimiento", "Money available date": "Dinero disponible", "Money needed": "Necesario", "Real pressure": "Presión real", "Purchase month": "Mes de compra", "Monthly income": "Ingresos del mes", "Credit card next month": "Tarjeta mes siguiente", "Credit card installments": "Tarjeta en cuotas", "Debit month": "Mes de débito", "First debit month": "Primer mes de débito", Installments: "Cuotas", Notes: "Notas", "Details...": "Detalles...", "Extra income": "Ingreso extra", "Variable expense": "Gasto variable", "Edit expense": "Editar gasto", "Save expense": "Guardar gasto", "Save changes": "Guardar cambios", "Save event": "Guardar evento", Delete: "Eliminar", "Delete this event?": "¿Eliminar este evento?", "Want to add a trip? Use the Add trip button in the main menu.": "¿Quieres añadir un viaje? Usa el botón Viaje del menú principal.",
    "Edit trip": "Editar viaje", "New trip": "Nuevo viaje", Name: "Nombre", "Rome, Paris...": "Roma, París...", Departure: "Salida", Return: "Vuelta", "Total budget (€)": "Presupuesto total (€)", Color: "Color", "Expense breakdown": "Desglose de gastos", Remaining: "Restante", Exceeded: "Excedido", "of budget": "del presupuesto", "Save trip": "Guardar viaje", "Edit lever": "Editar palanca", "New lever": "Nueva palanca", Subcategory: "Subcategoría", "Example lever": "Ej: Alquiler coche agosto", "Estimated amount (€)": "Importe estimado (€)", "Context or conditions...": "Contexto o condiciones...", "When this lever is active, {amount} is added to variable income for {month}": "Al activar esta palanca, {amount} se sumará a los ingresos variables de {month}", "Save lever": "Guardar palanca",
    "Edit debt": "Editar deuda", "New debt": "Nueva deuda", "Name / Creditor": "Nombre / Acreedor", "Monthly payment (€)": "Cuota mensual (€)", "Monthly interest / fee (€)": "Interés / gasto mes (€)", "Total payments": "Cuotas totales", "Paid payments": "Cuotas pagadas", "First payment month": "Mes primera cuota", "Calculated summary": "Resumen calculado", "Outstanding principal": "Pendiente capital", "Interest cost": "Coste intereses", "Monthly impact": "Impacto mensual", "Estimated finish date": "Fecha fin estimada", Progress: "Progreso", "Save debt": "Guardar deuda",
    "Total tasks": "Total tareas", completed: "completadas", "In progress": "En curso", Budgeted: "Presupuesto", Spent: "Gastado", List: "Lista", All: "Todas", Task: "Tarea", "No tasks. Add the first one!": "No hay tareas. ¡Añadí la primera!", "No tasks": "Sin tareas", "Edit task": "Editar tarea", "New task": "Nueva tarea", Room: "Habitación", Title: "Título", "Example task": "Ej: Pintar paredes", Priority: "Prioridad", Status: "Estado", Start: "Inicio", End: "Fin", "Spent (€)": "Gastado (€)", spent: "gastado", "Observations...": "Observaciones...", "Create task": "Crear tarea", "Delete this task?": "¿Eliminar esta tarea?",
    Week: "Semana", more: "más", Restaurant: "Restaurante", Transport: "Transporte", Clothes: "Ropa", Trip: "Viaje", Both: "Ambos", Flight: "Vuelo", Activities: "Actividades", "Guest room": "Hab. huéspedes", Entry: "Entrada", Income: "Ingreso", "Car": "Coche", "Sales": "Ventas", "Other": "Otros", "Supermarket": "Supermercado", "Housing": "Casa", "Food": "Comida", "Leisure": "Ocio", "Health": "Salud", "Utility bills": "Suministros", "Mobile": "Móvil", "Water": "Agua", "Power": "Luz", "Gas": "Gas", "Internet": "Internet", "Living room": "Salón", "Kitchen": "Cocina", "Bedroom": "Dormitorio", "Bathroom": "Baño", "Terrace": "Terraza", "Low": "Baja", "Medium": "Media", "High": "Alta", "Pending": "Pendiente", "Blocked": "Bloqueado", "Done": "Completado",
  },
  ca: {
    Language: "Idioma", Budget: "Pressupost", Calendar: "Calendari", Home: "Casa", "Add event": "+ Esdeveniment", "Add trip": "Viatge", Logout: "Sortir", "Synced with API": "Sincronitzat amb l'API", "Local mode": "Mode local", Loading: "Carregant", Login: "Entrar", "Create account": "Crear compte", "Private access": "Accés privat", "Application name": "Nom de l'aplicació", Username: "Usuari", Password: "Contrasenya", "Logging in...": "Entrant...", "Creating...": "Creant...", "Could not create the account": "No s'ha pogut crear el compte", "Could not log in": "No s'ha pogut iniciar sessió",
    "Fixed income": "Ingressos fixos", "Previous card balance": "Saldo targeta mes anterior", "Variable income": "Ingressos variables", "Inactive potential": "Potencial sense activar", "Fixed expenses": "Despeses fixes", "Financial pressure": "Pressió financera", "Outstanding debt": "Deute pendent", "Monthly summary": "Resum mensual", "Income · expenses · debt snapshot": "Ingressos · despeses · deute", "Monthly adjustment": "Ajust mensual", "guaranteed monthly": "mensual garantit", "year to date": "acumulat", "monthly structure": "estructura mensual", "of committed income": "de l'ingrés compromès", "Next payoff": "Proper final", "Income structure": "INGRESSOS", "Guaranteed fixed · Recorded variable · Activatable potential": "Fixos garantits · Variables registrats · Potencial activable", "Monthly total": "Total mensual", "This month total": "Total aquest mes", Levers: "Palanques", New: "Nova", "No levers yet": "Encara no hi ha palanques", Active: "Activa", Activate: "Activar",
    "Monthly variable expenses": "DESPESES", "Utilities · Discretionary · Trips": "Subministraments · Discrecional · Viatges", "this month": "aquest mes", "Fixed costs": "Despeses fixes", Utilities: "Subministraments", Discretionary: "Discrecional", Trips: "Viatges", "No calendar expenses": "Sense despeses al calendari", "No trips this month": "Sense viatges aquest mes", "Layered expenses": "Despeses per capa", "Hover each bar · future months are gray estimates": "Passa el cursor per cada barra · futur estimat en gris", Structural: "Estructural", "Total income": "Ingressos totals", Balance: "Saldo", estimated: "estimat", "Active levers": "Palanques actives", Pressure: "Pressió", "Variable expenses by category": "Despeses variables per categoria", "Edit utility bill": "Editar subministrament", Provider: "Proveïdor", "Provider name": "Nom del proveïdor", "Billing frequency": "Freqüència de factura", Consumption: "Consum", Unit: "Unitat", "Billing period": "Període facturat", Monthly: "Mensual", Bimonthly: "Bimestral", Quarterly: "Trimestral", Annual: "Anual", "One-off": "Puntual", "Cash flow month": "Mes de pagament", "Save utility bill": "Guardar subministrament", "Expense explorer": "Explorador de despeses", "Monthly evolution": "Evolució mensual", "No utility data": "Sense dades de subministraments", "No records": "Sense registres", "Selected month": "Mes seleccionat", "Annual total": "Total anual", Average: "Mitjana", "Financial pressure analyzer": "Analitzador de pressió financera", "Committed structure · income stress test": "Estructura compromesa · prova d'ingressos", "Committed spending": "Despesa compromesa", "of spending": "de la despesa", "Minimum income for current lifestyle": "Ingrés mínim per al nivell actual", "all monthly spending": "tota la despesa mensual", "Income drop room": "Marge de caiguda d'ingressos", "before deficit": "abans de dèficit", "Expense commitment": "Compromís de la despesa", "Fixed income covers essentials": "Els ingressos fixos cobreixen l'essencial", "Fixed income does not cover essentials": "Els ingressos fixos no cobreixen l'essencial", "Minimum income for essentials": "Ingrés mínim per a essencials", "Lifestyle needs a buffer": "El nivell de vida necessita marge", "Lifestyle is sustainable at current income": "El nivell de vida és sostenible amb l'ingrés actual", "Lifestyle is tight under lower income": "El nivell de vida va just amb menys ingressos", "Stress test with lower income": "Prova amb menys ingressos", "Current income": "Ingrés actual", "Only fixed income": "Només ingressos fixos", "Maintains current lifestyle": "Manté el nivell actual", "Surplus {amount}": "Sobren {amount}", "Needs lifestyle adjustment": "Cal ajustar el nivell de vida", "Cut {amount}": "Retallar {amount}", "Structural gap": "Bretxa estructural", "Fixed-only balance": "Saldo només amb ingressos fixos",
    Debt: "Deutes", debts: "deutes", "Debt panel": "Deutes", "This month's payment": "Quota aquest mes", "balance impact": "impacte en saldo", "Active debts": "Deutes actius", "Global repayment progress": "Progrés global d'amortització", "No debts registered": "Sense deutes registrats", "Paid off": "Saldat", "This month!": "Aquest mes!", month: "mes", months: "mesos", "Paid principal": "Capital pagat", "Paid interest": "Interessos pagats", "Total impact": "Impacte total", Paid: "Pagada", Close: "Tancar", "to free": "per alliberar", "capital + interest": "capital + interessos", "/month": "/mes", "Income freed without debt": "S'alliberen en total", "Monthly debt-free projection": "Projecció sense deutes", "Month-by-month payment release · impact on free balance": "Alliberament de quotes mes a mes · impacte en saldo lliure", "Free balance today": "Saldo lliure avui", "Free balance without debt": "Saldo lliure sense deutes", "Total released": "S'alliberen en total", "with all payments active": "amb totes les quotes actives", "once everything is paid off": "quan tot estigui saldat", "per month when finished": "€/mes quan acabin", Month: "Mes", Payments: "Quotes", "Free balance": "Saldo lliure", last: "última", pending: "pend.", "final payment": "última quota", "is released": "s'alliberen", "per month": "mes",
    "Block room": "Bloquejar habitació", "Block car": "Bloquejar cotxe", Occupied: "Ocupada", From: "Des de", To: "Fins", Note: "Nota", "Guests, reason...": "Hostes, motiu...", nights: "nits", night: "nit", "Save block": "Guardar bloqueig", "Start time": "Hora inici", "End time": "Hora fi", "Monthly free balance": "saldo lliure del mes", Extras: "Extres", Variable: "Variable", "By category": "Per categoria", "Expenses by category and funding": "Despesa per categoria i origen", record: "registre", records: "registres", Birthdays: "Aniversaris", saved: "guardats", "No birthdays saved": "Sense aniversaris guardats", days: "dies", "Add birthday": "Afegir aniversari", "Supermarket purchases": "Compres del súper", Store: "Botiga", Product: "Producte", "Add product": "Afegir producte", "Save supermarket purchase": "Guardar compra del súper", "products tracked": "productes carregats", "Car ROI": "ROI Cotxe", of: "de",
    "Edit event": "Editar esdeveniment", "New event": "Nou esdeveniment", Type: "Tipus", "Who is it for?": "De qui és?", "Booking details": "Dades de la reserva", Guests: "Hostes", "Example guests": "Ex: Marc & Sofia", Nights: "Nits", "per night": "€/nit", single: "individual", couple: "parella", "family/free": "família/gratis", Total: "Total", "Car rental": "Lloguer de cotxe", Days: "Dies", Net: "Net", Description: "Descripció", "What is it?": "Què és?", Date: "Data", Time: "Hora", "Amount (€)": "Import (€)", "Funding source": "Origen dels fons", Card: "Targeta", "Card name": "Nom de targeta", "Card closing day": "Dia de tancament", "Invoice date": "Data factura", "Due date": "Venciment", "Money available date": "Diners disponibles", "Money needed": "Necessari", "Real pressure": "Pressió real", "Purchase month": "Mes de compra", "Monthly income": "Ingressos del mes", "Credit card next month": "Targeta mes següent", "Credit card installments": "Targeta en quotes", "Debit month": "Mes de dèbit", "First debit month": "Primer mes de dèbit", Installments: "Quotes", Notes: "Notes", "Details...": "Detalls...", "Extra income": "Ingrés extra", "Variable expense": "Despesa variable", "Edit expense": "Editar despesa", "Save expense": "Guardar despesa", "Save changes": "Guardar canvis", "Save event": "Guardar esdeveniment", Delete: "Eliminar", "Delete this event?": "Eliminar aquest esdeveniment?", "Want to add a trip? Use the Add trip button in the main menu.": "Vols afegir un viatge? Usa el botó Viatge del menú principal.",
    "Edit trip": "Editar viatge", "New trip": "Nou viatge", Name: "Nom", "Rome, Paris...": "Roma, París...", Departure: "Sortida", Return: "Tornada", "Total budget (€)": "Pressupost total (€)", Color: "Color", "Expense breakdown": "Desglossament de despeses", Remaining: "Restant", Exceeded: "Excedit", "of budget": "del pressupost", "Save trip": "Guardar viatge", "Edit lever": "Editar palanca", "New lever": "Nova palanca", Subcategory: "Subcategoria", "Example lever": "Ex: Lloguer cotxe agost", "Estimated amount (€)": "Import estimat (€)", "Context or conditions...": "Context o condicions...", "When this lever is active, {amount} is added to variable income for {month}": "En activar aquesta palanca, {amount} se sumarà als ingressos variables de {month}", "Save lever": "Guardar palanca",
    "Edit debt": "Editar deute", "New debt": "Nou deute", "Name / Creditor": "Nom / Creditor", "Monthly payment (€)": "Quota mensual (€)", "Monthly interest / fee (€)": "Interès / despesa mes (€)", "Total payments": "Quotes totals", "Paid payments": "Quotes pagades", "First payment month": "Mes primera quota", "Calculated summary": "Resum calculat", "Outstanding principal": "Capital pendent", "Interest cost": "Cost interessos", "Monthly impact": "Impacte mensual", "Estimated finish date": "Data final estimada", Progress: "Progrés", "Save debt": "Guardar deute",
    "Total tasks": "Total tasques", completed: "completades", "In progress": "En curs", Budgeted: "Pressupost", Spent: "Gastat", List: "Llista", All: "Totes", Task: "Tasca", "No tasks. Add the first one!": "No hi ha tasques. Afegeix la primera!", "No tasks": "Sense tasques", "Edit task": "Editar tasca", "New task": "Nova tasca", Room: "Habitació", Title: "Títol", "Example task": "Ex: Pintar parets", Priority: "Prioritat", Status: "Estat", Start: "Inici", End: "Fi", "Spent (€)": "Gastat (€)", spent: "gastat", "Observations...": "Observacions...", "Create task": "Crear tasca", "Delete this task?": "Eliminar aquesta tasca?",
    Week: "Setmana", more: "més", Restaurant: "Restaurant", Transport: "Transport", Clothes: "Roba", Trip: "Viatge", Both: "Tots dos", Flight: "Vol", Activities: "Activitats", "Guest room": "Hab. hostes", Entry: "Entrada", Income: "Ingrés", "Car": "Cotxe", "Sales": "Vendes", "Other": "Altres", "Supermarket": "Supermercat", "Housing": "Casa", "Food": "Menjar", "Leisure": "Oci", "Health": "Salut", "Utility bills": "Subministraments", "Mobile": "Mòbil", "Water": "Aigua", "Power": "Llum", "Gas": "Gas", "Internet": "Internet", "Living room": "Saló", "Kitchen": "Cuina", "Bedroom": "Dormitori", "Bathroom": "Bany", "Terrace": "Terrassa", "Low": "Baixa", "Medium": "Mitjana", "High": "Alta", "Pending": "Pendent", "Blocked": "Bloquejat", "Done": "Completat",
  },
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const isLanguage = (value: string | null): value is Language => languages.some((language) => language.code === value);

const readStoredLanguage = () => {
  try {
    return typeof window === "undefined" || typeof window.localStorage?.getItem !== "function" ? null : window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const writeStoredLanguage = (language: Language) => {
  try {
    if (typeof window.localStorage?.setItem === "function") window.localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Storage can be unavailable in restricted browsers or test doubles.
  }
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const stored = readStoredLanguage();
    return isLanguage(stored) ? stored : "en";
  });

  useEffect(() => {
    writeStoredLanguage(language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((nextLanguage: Language) => setLanguageState(nextLanguage), []);

  const t = useCallback((key: string, params: Record<string, string | number> = {}) => {
    const template = translations[language][key] || translations.en[key] || key;
    return Object.entries(params).reduce((text, [paramKey, value]) => text.replaceAll(`{${paramKey}}`, String(value)), template);
  }, [language]);

  const monthName = useCallback((index: number, format: "long" | "short" = "long") => monthNames[language][format][index], [language]);
  const weekdayName = useCallback((index: number) => monthNames[language].weekdays[index], [language]);

  const value = useMemo(() => ({ language, languages, setLanguage, t, monthName, weekdayName }), [language, setLanguage, t, monthName, weekdayName]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useI18n must be used within LanguageProvider");
  return context;
};