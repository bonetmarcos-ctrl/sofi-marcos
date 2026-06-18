// ─── CATEGORÍAS DE EVENTOS ────────────────────────────────────────────────────
export const CATEGORIAS = {
  ocio:        { label:"Ocio",        emoji:"🎬", color:"#FF6B6B", bg:"#FFF0F0", tipo:"gasto" },
  restaurante: { label:"Restaurante", emoji:"🍽️", color:"#FE6D73", bg:"#FEF9EF", tipo:"gasto" },
  hogar:       { label:"Hogar",       emoji:"🏠", color:"#C6AC8F", bg:"#F5EFE6", tipo:"gasto" },
  salud:       { label:"Salud",       emoji:"🩷", color:"#BE95C4", bg:"#F3EAF7", tipo:"gasto" },
  transporte:  { label:"Transporte",  emoji:"🚌", color:"#5E548E", bg:"#EDEAF5", tipo:"gasto" },
  ropa:        { label:"Ropa",        emoji:"👗", color:"#FF86C8", bg:"#FFF0FA", tipo:"gasto" },
  habitacion:  { label:"Habitación",  emoji:"🛏️", color:"#FFBF81", bg:"#FFF7EE", tipo:"ingreso" },
  coche:       { label:"Coche",       emoji:"🔑", color:"#FFDC5E", bg:"#FFFBE6", tipo:"ingreso" },
  viaje:       { label:"Viaje",       emoji:"✈️", color:"#FF69EB", bg:"#FFF0FD", tipo:"gasto" },
  otro:        { label:"Otro",        emoji:"📌", color:"#22333B", bg:"#EAE0D5", tipo:"gasto" },
};

// ─── SUMINISTROS ──────────────────────────────────────────────────────────────
export const SUMINISTROS_TIPOS = [
  { key:"luz",      label:"Luz",      emoji:"⚡" },
  { key:"gas",      label:"Gas",      emoji:"🔥" },
  { key:"agua",     label:"Agua",     emoji:"💧" },
  { key:"internet", label:"Internet", emoji:"📶" },
  { key:"movil",    label:"Móvil",    emoji:"📱" },
  { key:"otro",     label:"Otro",     emoji:"📌" },
];

// ─── GRUPOS DE GASTO ──────────────────────────────────────────────────────────
export const GRUPOS_GASTO = {
  ocio:     { label:"Ocio",     emoji:"🎬", cats:["ocio","restaurante"], color:"#FE6D73", bg:"#FEF9EF" },
  personal: { label:"Personal", emoji:"👤", cats:["salud","ropa"],       color:"#BE95C4", bg:"#F3EAF7" },
  hogar:    { label:"Hogar",    emoji:"🏠", cats:["hogar","transporte"], color:"#C6AC8F", bg:"#F5EFE6" },
  viajes:   { label:"Viajes",   emoji:"✈️", cats:["viaje"],              color:"#FF69EB", bg:"#FFF0FD" },
  otro:     { label:"Otros",    emoji:"📌", cats:["otro"],               color:"#22333B", bg:"#EAE0D5" },
};

// ─── PERSONAS ─────────────────────────────────────────────────────────────────
export const PERSONAS = {
  ambos:  { label:"Ambos",  color:"#5E548E", bg:"#EDEAF5" },
  sofi:   { label:"Sofi",   color:"#8b5cf6", bg:"#fdf2f8" },
  marqui: { label:"Marqui", color:"#0891b2", bg:"#ecfeff" },
};

// ─── VIAJES ───────────────────────────────────────────────────────────────────
export const COLOR_VIAJE = "#FF69EB";
export const BG_VIAJE    = "#FFF0FD";

export const GASTOS_VIAJE = [
  { key:"vuelo",       label:"Vuelo",       emoji:"✈️" },
  { key:"hotel",       label:"Hotel",       emoji:"🏨" },
  { key:"transporte",  label:"Transporte",  emoji:"🚌" },
  { key:"restaurante", label:"Comida",      emoji:"🍽️" },
  { key:"actividades", label:"Actividades", emoji:"🎡" },
  { key:"otro",        label:"Otros",       emoji:"📌" },
];

export const COLORES_VIAJE = ["#38bdf8"];

// ─── PALANCAS ─────────────────────────────────────────────────────────────────
export const SUBCAT_VAR = {
  habitacion: { label:"Habitación", emoji:"🛏️", color:"#A7CF99", bg:"#EEF7EB" },
  coche:      { label:"Coche",      emoji:"🚗", color:"#3A949E", bg:"#E6F2F4" },
  ventas:     { label:"Ventas",     emoji:"📦", color:"#b45309", bg:"#fffbeb" },
  otros:      { label:"Otros",      emoji:"📌", color:"#6E7177", bg:"#F5F7FA" },
};
