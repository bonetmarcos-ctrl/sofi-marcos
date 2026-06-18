// ─── EVENT CATEGORIES ─────────────────────────────────────────────────────────
export const CATEGORIAS = {
  ocio:        { label:"Leisure",    emoji:"🎬", color:"#FF6B6B", bg:"#FFF0F0", tipo:"gasto" },
  restaurante: { label:"Restaurant", emoji:"🍽️", color:"#FE6D73", bg:"#FEF9EF", tipo:"gasto" },
  hogar:       { label:"Housing",    emoji:"🏠", color:"#C6AC8F", bg:"#F5EFE6", tipo:"gasto" },
  salud:       { label:"Health",     emoji:"🩷", color:"#BE95C4", bg:"#F3EAF7", tipo:"gasto" },
  transporte:  { label:"Transport",  emoji:"🚌", color:"#5E548E", bg:"#EDEAF5", tipo:"gasto" },
  ropa:        { label:"Clothes",    emoji:"👗", color:"#FF86C8", bg:"#FFF0FA", tipo:"gasto" },
  habitacion:  { label:"Room",       emoji:"🛏️", color:"#FFBF81", bg:"#FFF7EE", tipo:"ingreso" },
  coche:       { label:"Car",        emoji:"🔑", color:"#FFDC5E", bg:"#FFFBE6", tipo:"ingreso" },
  viaje:       { label:"Trip",       emoji:"✈️", color:"#FF69EB", bg:"#FFF0FD", tipo:"gasto" },
  otro:        { label:"Supermarket", emoji:"🛒", color:"#22333B", bg:"#EAE0D5", tipo:"gasto" },
};

// ─── UTILITIES ────────────────────────────────────────────────────────────────
export const SUMINISTROS_TIPOS = [
  { key:"luz",      label:"Power",    emoji:"⚡" },
  { key:"gas",      label:"Gas",      emoji:"🔥" },
  { key:"agua",     label:"Water",    emoji:"💧" },
  { key:"internet", label:"Internet", emoji:"📶" },
  { key:"movil",    label:"Mobile",   emoji:"📱" },
  { key:"otro",     label:"Other",    emoji:"📌" },
];

// ─── EXPENSE GROUPS ───────────────────────────────────────────────────────────
export const GRUPOS_GASTO = {
  ocio:     { label:"Leisure",  emoji:"🎬", cats:["ocio","restaurante"], color:"#FE6D73", bg:"#FEF9EF" },
  personal: { label:"Personal", emoji:"👤", cats:["salud","ropa"],       color:"#BE95C4", bg:"#F3EAF7" },
  hogar:    { label:"Housing",  emoji:"🏠", cats:["hogar","transporte"], color:"#C6AC8F", bg:"#F5EFE6" },
  viajes:   { label:"Trips",    emoji:"✈️", cats:["viaje"],              color:"#FF69EB", bg:"#FFF0FD" },
  otro:     { label:"Supermarket", emoji:"🛒", cats:["otro"],             color:"#22333B", bg:"#EAE0D5" },
};

// ─── PEOPLE ───────────────────────────────────────────────────────────────────
export const PERSONAS = {
  ambos:  { label:"Both",   color:"#5E548E", bg:"#EDEAF5" },
  sofi:   { label:"Sofi",   color:"#8b5cf6", bg:"#fdf2f8" },
  marqui: { label:"Marqui", color:"#0891b2", bg:"#ecfeff" },
};

// ─── TRIPS ────────────────────────────────────────────────────────────────────
export const COLOR_VIAJE = "#FF69EB";
export const BG_VIAJE    = "#FFF0FD";

export const GASTOS_VIAJE = [
  { key:"vuelo",       label:"Flight",      emoji:"✈️" },
  { key:"hotel",       label:"Hotel",       emoji:"🏨" },
  { key:"transporte",  label:"Transport",   emoji:"🚌" },
  { key:"restaurante", label:"Food",        emoji:"🍽️" },
  { key:"actividades", label:"Activities",  emoji:"🎡" },
  { key:"otro",        label:"Other",       emoji:"📌" },
];

export const COLORES_VIAJE = ["#38bdf8"];

// ─── LEVERS ───────────────────────────────────────────────────────────────────
export const SUBCAT_VAR = {
  habitacion: { label:"Room",  emoji:"🛏️", color:"#A7CF99", bg:"#EEF7EB" },
  coche:      { label:"Car",   emoji:"🚗", color:"#3A949E", bg:"#E6F2F4" },
  ventas:     { label:"Sales", emoji:"📦", color:"#b45309", bg:"#fffbeb" },
  otros:      { label:"Other", emoji:"📌", color:"#6E7177", bg:"#F5F7FA" },
};
