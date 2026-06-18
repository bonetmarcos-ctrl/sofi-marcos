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
    Username: "Username",
    Password: "Password",
    "Logging in...": "Logging in...",
    "Creating...": "Creating...",
    "Could not create the account": "Could not create the account",
    "Could not log in": "Could not log in",
    "Fixed income": "Fixed income",
    "Variable income": "Variable income",
    "Inactive potential": "Inactive potential",
    "Fixed expenses": "Fixed expenses",
    "Financial pressure": "Financial pressure",
    "Outstanding debt": "Outstanding debt",
    "guaranteed monthly": "guaranteed monthly",
    "year to date": "year to date",
    "monthly structure": "monthly structure",
    "of committed income": "of committed income",
    "Next payoff": "Next payoff",
    "Income structure": "Income structure",
    "Guaranteed fixed · Recorded variable · Activatable potential": "Guaranteed fixed · Recorded variable · Activatable potential",
    "Monthly total": "Monthly total",
    "This month total": "This month total",
    "Levers": "Levers",
    "New": "New",
    "No levers yet": "No levers yet",
    Active: "Active",
    Activate: "Activate",
    "Monthly variable expenses": "Monthly variable expenses",
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
    "Monthly free balance": "Monthly free balance",
    Extras: "Extras",
    Variable: "Variable",
    "By category": "By category",
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
    Language: "Idioma", Budget: "Presupuesto", Calendar: "Calendario", Home: "Casa", "Add event": "+ Evento", "Add trip": "Viaje", Logout: "Salir", "Synced with API": "Sincronizado con API", "Local mode": "Modo local", Loading: "Cargando", Login: "Entrar", "Create account": "Crear cuenta", "Private access": "Acceso privado", Username: "Usuario", Password: "Contraseña", "Logging in...": "Entrando...", "Creating...": "Creando...", "Could not create the account": "No se pudo crear la cuenta", "Could not log in": "No se pudo iniciar sesión",
    "Fixed income": "Ingresos fijos", "Variable income": "Ingresos variables", "Inactive potential": "Potencial sin activar", "Fixed expenses": "Gastos fijos", "Financial pressure": "Presión financiera", "Outstanding debt": "Deuda pendiente", "guaranteed monthly": "mensual garantizado", "year to date": "acumulado", "monthly structure": "estructura mensual", "of committed income": "del ingreso comprometido", "Next payoff": "Próx. fin", "Income structure": "Estructura de ingresos", "Guaranteed fixed · Recorded variable · Activatable potential": "Fijos garantizados · Variables registrados · Potencial activable", "Monthly total": "Total mensual", "This month total": "Total este mes", Levers: "Palancas", New: "Nueva", "No levers yet": "Sin palancas aún", Active: "Activa", Activate: "Activar",
    "Monthly variable expenses": "Gastos variables del mes", "Utilities · Discretionary · Trips": "Suministros · Discrecional · Viajes", "this month": "este mes", "Fixed costs": "Gastos fijos", Utilities: "Suministros", Discretionary: "Discrecional", Trips: "Viajes", "No calendar expenses": "Sin gastos en el calendario", "No trips this month": "Sin viajes este mes", "Layered expenses": "Gastos por capa", "Hover each bar · future months are gray estimates": "Pasá el mouse sobre cada barra · futuro en gris estimado", Structural: "Estructural", "Total income": "Ingresos totales", Balance: "Saldo", estimated: "estimado", "Active levers": "Palancas activas", Pressure: "Presión", "Variable expenses by category": "Gastos variables por categoría",
    Debt: "Deudas", debts: "deudas", "Debt panel": "Deudas", "This month's payment": "Cuota este mes", "balance impact": "impacto en saldo", "Active debts": "Deudas activas", "Global repayment progress": "Progreso global de amortización", "No debts registered": "Sin deudas registradas", "Paid off": "Saldada", "This month!": "¡Este mes!", month: "mes", months: "meses", "Paid principal": "Capital pagado", "Paid interest": "Intereses pagados", "Total impact": "Impacto total", Paid: "Pagada", Close: "Cerrar", "to free": "para liberar", "capital + interest": "capital + intereses", "/month": "/mes", "Income freed without debt": "Se liberan en total", "Monthly debt-free projection": "Proyección sin deudas", "Month-by-month payment release · impact on free balance": "Liberación de cuotas mes a mes · impacto en saldo libre", "Free balance today": "Saldo libre hoy", "Free balance without debt": "Saldo libre sin deudas", "Total released": "Se liberan en total", "with all payments active": "con todas las cuotas activas", "once everything is paid off": "cuando estén todas saldadas", "per month when finished": "€/mes cuando acaben", Month: "Mes", Payments: "Cuotas", "Free balance": "Saldo libre", last: "última", pending: "pend.", "final payment": "última cuota", "is released": "se liberan", "per month": "mes",
    "Block room": "Bloquear habitación", "Block car": "Bloquear coche", Occupied: "Ocupada", From: "Desde", To: "Hasta", Note: "Nota", "Guests, reason...": "Huéspedes, motivo...", nights: "noches", night: "noche", "Save block": "Guardar bloqueo", "Monthly free balance": "saldo libre del mes", Extras: "Extras", Variable: "Variable", "By category": "Por categoría", "Car ROI": "ROI Coche", of: "de",
    "Edit event": "Editar evento", "New event": "Nuevo evento", Type: "Tipo", "Who is it for?": "¿De quién?", "Booking details": "Datos de la reserva", Guests: "Huéspedes", "Example guests": "Ej: Marc & Sofía", Nights: "Noches", "per night": "€/noche", single: "individual", couple: "pareja", "family/free": "familia/gratis", Total: "Total", "Car rental": "Alquiler coche", Days: "Días", Net: "Neto", Description: "Descripción", "What is it?": "¿Qué es?", Date: "Fecha", Time: "Hora", "Amount (€)": "Importe (€)", Notes: "Notas", "Details...": "Detalles...", "Extra income": "Ingreso extra", "Variable expense": "Gasto variable", "Edit expense": "Editar gasto", "Save expense": "Guardar gasto", "Save changes": "Guardar cambios", "Save event": "Guardar evento", Delete: "Eliminar", "Delete this event?": "¿Eliminar este evento?", "Want to add a trip? Use the Add trip button in the main menu.": "¿Quieres añadir un viaje? Usa el botón Viaje del menú principal.",
    "Edit trip": "Editar viaje", "New trip": "Nuevo viaje", Name: "Nombre", "Rome, Paris...": "Roma, París...", Departure: "Salida", Return: "Vuelta", "Total budget (€)": "Presupuesto total (€)", Color: "Color", "Expense breakdown": "Desglose de gastos", Remaining: "Restante", Exceeded: "Excedido", "of budget": "del presupuesto", "Save trip": "Guardar viaje", "Edit lever": "Editar palanca", "New lever": "Nueva palanca", Subcategory: "Subcategoría", "Example lever": "Ej: Alquiler coche agosto", "Estimated amount (€)": "Importe estimado (€)", "Context or conditions...": "Contexto o condiciones...", "When this lever is active, {amount} is added to variable income for {month}": "Al activar esta palanca, {amount} se sumará a los ingresos variables de {month}", "Save lever": "Guardar palanca",
    "Edit debt": "Editar deuda", "New debt": "Nueva deuda", "Name / Creditor": "Nombre / Acreedor", "Monthly payment (€)": "Cuota mensual (€)", "Monthly interest / fee (€)": "Interés / gasto mes (€)", "Total payments": "Cuotas totales", "Paid payments": "Cuotas pagadas", "First payment month": "Mes primera cuota", "Calculated summary": "Resumen calculado", "Outstanding principal": "Pendiente capital", "Interest cost": "Coste intereses", "Monthly impact": "Impacto mensual", "Estimated finish date": "Fecha fin estimada", Progress: "Progreso", "Save debt": "Guardar deuda",
    "Total tasks": "Total tareas", completed: "completadas", "In progress": "En curso", Budgeted: "Presupuesto", Spent: "Gastado", List: "Lista", All: "Todas", Task: "Tarea", "No tasks. Add the first one!": "No hay tareas. ¡Añadí la primera!", "No tasks": "Sin tareas", "Edit task": "Editar tarea", "New task": "Nueva tarea", Room: "Habitación", Title: "Título", "Example task": "Ej: Pintar paredes", Priority: "Prioridad", Status: "Estado", Start: "Inicio", End: "Fin", "Spent (€)": "Gastado (€)", spent: "gastado", "Observations...": "Observaciones...", "Create task": "Crear tarea", "Delete this task?": "¿Eliminar esta tarea?",
    Week: "Semana", more: "más", Restaurant: "Restaurante", Transport: "Transporte", Clothes: "Ropa", Trip: "Viaje", Both: "Ambos", Flight: "Vuelo", Activities: "Actividades", "Guest room": "Hab. huéspedes", Entry: "Entrada", Income: "Ingreso", "Car": "Coche", "Sales": "Ventas", "Other": "Otros", "Supermarket": "Supermercado", "Housing": "Casa", "Food": "Comida", "Leisure": "Ocio", "Health": "Salud", "Utility bills": "Suministros", "Mobile": "Móvil", "Water": "Agua", "Power": "Luz", "Gas": "Gas", "Internet": "Internet", "Living room": "Salón", "Kitchen": "Cocina", "Bedroom": "Dormitorio", "Bathroom": "Baño", "Terrace": "Terraza", "Low": "Baja", "Medium": "Media", "High": "Alta", "Pending": "Pendiente", "Blocked": "Bloqueado", "Done": "Completado",
  },
  ca: {
    Language: "Idioma", Budget: "Pressupost", Calendar: "Calendari", Home: "Casa", "Add event": "+ Esdeveniment", "Add trip": "Viatge", Logout: "Sortir", "Synced with API": "Sincronitzat amb l'API", "Local mode": "Mode local", Loading: "Carregant", Login: "Entrar", "Create account": "Crear compte", "Private access": "Accés privat", Username: "Usuari", Password: "Contrasenya", "Logging in...": "Entrant...", "Creating...": "Creant...", "Could not create the account": "No s'ha pogut crear el compte", "Could not log in": "No s'ha pogut iniciar sessió",
    "Fixed income": "Ingressos fixos", "Variable income": "Ingressos variables", "Inactive potential": "Potencial sense activar", "Fixed expenses": "Despeses fixes", "Financial pressure": "Pressió financera", "Outstanding debt": "Deute pendent", "guaranteed monthly": "mensual garantit", "year to date": "acumulat", "monthly structure": "estructura mensual", "of committed income": "de l'ingrés compromès", "Next payoff": "Proper final", "Income structure": "Estructura d'ingressos", "Guaranteed fixed · Recorded variable · Activatable potential": "Fixos garantits · Variables registrats · Potencial activable", "Monthly total": "Total mensual", "This month total": "Total aquest mes", Levers: "Palanques", New: "Nova", "No levers yet": "Encara no hi ha palanques", Active: "Activa", Activate: "Activar",
    "Monthly variable expenses": "Despeses variables del mes", "Utilities · Discretionary · Trips": "Subministraments · Discrecional · Viatges", "this month": "aquest mes", "Fixed costs": "Despeses fixes", Utilities: "Subministraments", Discretionary: "Discrecional", Trips: "Viatges", "No calendar expenses": "Sense despeses al calendari", "No trips this month": "Sense viatges aquest mes", "Layered expenses": "Despeses per capa", "Hover each bar · future months are gray estimates": "Passa el cursor per cada barra · futur estimat en gris", Structural: "Estructural", "Total income": "Ingressos totals", Balance: "Saldo", estimated: "estimat", "Active levers": "Palanques actives", Pressure: "Pressió", "Variable expenses by category": "Despeses variables per categoria",
    Debt: "Deutes", debts: "deutes", "Debt panel": "Deutes", "This month's payment": "Quota aquest mes", "balance impact": "impacte en saldo", "Active debts": "Deutes actius", "Global repayment progress": "Progrés global d'amortització", "No debts registered": "Sense deutes registrats", "Paid off": "Saldat", "This month!": "Aquest mes!", month: "mes", months: "mesos", "Paid principal": "Capital pagat", "Paid interest": "Interessos pagats", "Total impact": "Impacte total", Paid: "Pagada", Close: "Tancar", "to free": "per alliberar", "capital + interest": "capital + interessos", "/month": "/mes", "Income freed without debt": "S'alliberen en total", "Monthly debt-free projection": "Projecció sense deutes", "Month-by-month payment release · impact on free balance": "Alliberament de quotes mes a mes · impacte en saldo lliure", "Free balance today": "Saldo lliure avui", "Free balance without debt": "Saldo lliure sense deutes", "Total released": "S'alliberen en total", "with all payments active": "amb totes les quotes actives", "once everything is paid off": "quan tot estigui saldat", "per month when finished": "€/mes quan acabin", Month: "Mes", Payments: "Quotes", "Free balance": "Saldo lliure", last: "última", pending: "pend.", "final payment": "última quota", "is released": "s'alliberen", "per month": "mes",
    "Block room": "Bloquejar habitació", "Block car": "Bloquejar cotxe", Occupied: "Ocupada", From: "Des de", To: "Fins", Note: "Nota", "Guests, reason...": "Hostes, motiu...", nights: "nits", night: "nit", "Save block": "Guardar bloqueig", "Monthly free balance": "saldo lliure del mes", Extras: "Extres", Variable: "Variable", "By category": "Per categoria", "Car ROI": "ROI Cotxe", of: "de",
    "Edit event": "Editar esdeveniment", "New event": "Nou esdeveniment", Type: "Tipus", "Who is it for?": "De qui és?", "Booking details": "Dades de la reserva", Guests: "Hostes", "Example guests": "Ex: Marc & Sofia", Nights: "Nits", "per night": "€/nit", single: "individual", couple: "parella", "family/free": "família/gratis", Total: "Total", "Car rental": "Lloguer de cotxe", Days: "Dies", Net: "Net", Description: "Descripció", "What is it?": "Què és?", Date: "Data", Time: "Hora", "Amount (€)": "Import (€)", Notes: "Notes", "Details...": "Detalls...", "Extra income": "Ingrés extra", "Variable expense": "Despesa variable", "Edit expense": "Editar despesa", "Save expense": "Guardar despesa", "Save changes": "Guardar canvis", "Save event": "Guardar esdeveniment", Delete: "Eliminar", "Delete this event?": "Eliminar aquest esdeveniment?", "Want to add a trip? Use the Add trip button in the main menu.": "Vols afegir un viatge? Usa el botó Viatge del menú principal.",
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