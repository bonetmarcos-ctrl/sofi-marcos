export const COLOR_VIAJE = "#2F80A8";
export const BG_VIAJE    = "#EAF6FB";
export const COLOR_VIAJE_MID = "#78B8D6";

// ─── EVENT CATEGORIES ─────────────────────────────────────────────────────────
export const CATEGORIAS = {
  ocio:        { label:"Leisure",    emoji:"🎬", color:"#FF6B6B", bg:"#FFF0F0", tipo:"gasto" },
  restaurante: { label:"Restaurant", emoji:"🍽️", color:"#FE6D73", bg:"#FEF9EF", tipo:"gasto" },
  hogar:       { label:"Housing",    emoji:"🏠", color:"#C6AC8F", bg:"#F5EFE6", tipo:"gasto" },
  salud:       { label:"Health",     emoji:"🩷", color:"#BE95C4", bg:"#F3EAF7", tipo:"gasto" },
  transporte:  { label:"Transport",  emoji:"🚌", color:"#5E548E", bg:"#EDEAF5", tipo:"gasto" },
  ropa:        { label:"Clothes",    emoji:"👗", color:"#FF86C8", bg:"#FFF0FA", tipo:"gasto" },
  habitacion:  { label:"Room",       emoji:"🛏️", color:"#6F9F61", bg:"#EEF7EB", tipo:"ingreso" },
  coche:       { label:"Car",        emoji:"🔑", color:"#2F6F5E", bg:"#EAF3EE", tipo:"ingreso" },
  viaje:       { label:"Trip",       emoji:"✈️", color:COLOR_VIAJE, bg:BG_VIAJE, tipo:"gasto" },
  otro:        { label:"Supermarket", emoji:"🛒", color:"#22333B", bg:"#EAE0D5", tipo:"gasto" },
};

export const categoriaEventoKey = (evento) => {
  if (evento?.categoria === "hogar" && /supermercado/i.test(evento?.titulo || "")) return "otro";
  return evento?.categoria;
};

export const categoriaEvento = (evento) => CATEGORIAS[categoriaEventoKey(evento)];

export const CATEGORIAS_OCULTAS_CALENDARIO = new Set(["otro", "transporte", "hogar"]);

export const eventoVisibleEnCalendario = (evento) => !CATEGORIAS_OCULTAS_CALENDARIO.has(categoriaEventoKey(evento));

export const CATEGORIAS_IMPORTE_OCULTO_CALENDARIO = new Set(["ocio", "restaurante"]);

export const eventoMuestraImporteEnCalendario = (evento) => !CATEGORIAS_IMPORTE_OCULTO_CALENDARIO.has(categoriaEventoKey(evento));

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
  viajes:   { label:"Trips",    emoji:"✈️", cats:["viaje"],              color:COLOR_VIAJE, bg:BG_VIAJE },
  otro:     { label:"Supermarket", emoji:"🛒", cats:["otro"],             color:"#22333B", bg:"#EAE0D5" },
};

// ─── PEOPLE ───────────────────────────────────────────────────────────────────
export const PERSONAS = {
  ambos:  { label:"Both",   color:"#5E548E", bg:"#EDEAF5" },
  sofi:   { label:"Sofi",   color:"#8b5cf6", bg:"#fdf2f8" },
  marqui: { label:"Marqui", color:"#0891b2", bg:"#ecfeff" },
};

export const GASTOS_VIAJE = [
  { key:"vuelo",       label:"Flight",      emoji:"✈️" },
  { key:"hotel",       label:"Hotel",       emoji:"🏨" },
  { key:"transporte",  label:"Transport",   emoji:"🚌" },
  { key:"restaurante", label:"Food",        emoji:"🍽️" },
  { key:"actividades", label:"Activities",  emoji:"🎡" },
  { key:"otro",        label:"Other",       emoji:"📌" },
];

export const COLORES_VIAJE = [COLOR_VIAJE];

// ─── LEVERS ───────────────────────────────────────────────────────────────────
export const SUBCAT_VAR = {
  habitacion: { label:"Room",  emoji:"🛏️", color:"#6F9F61", bg:"#EEF7EB" },
  coche:      { label:"Car",   emoji:"🚗", color:"#2F6F5E", bg:"#EAF3EE" },
  ventas:     { label:"Sales", emoji:"📦", color:"#4F9D69", bg:"#EBF9EF" },
  otros:      { label:"Other", emoji:"📌", color:"#5F846D", bg:"#F0F6F2" },
};
