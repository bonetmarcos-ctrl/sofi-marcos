export const HABITACIONES = [
  { id:"salon",     label:"Salón",          emoji:"🛋️", color:"#7c3aed" },
  { id:"cocina",    label:"Cocina",         emoji:"🍳", color:"#ea580c" },
  { id:"dormi",     label:"Dormitorio",     emoji:"🛏️", color:"#059669" },
  { id:"bano",      label:"Baño",           emoji:"🚿", color:"#0891b2" },
  { id:"huespedes", label:"Hab. huéspedes", emoji:"🏠", color:"#8b5cf6" },
  { id:"terraza",   label:"Terraza",        emoji:"🌿", color:"#16a34a" },
  { id:"entrada",   label:"Entrada",        emoji:"🚪", color:"#b45309" },
  { id:"otro",      label:"Otro",           emoji:"📦", color:"#475569" },
];

export const PRIORIDADES = {
  alta:  { label:"Alta",  color:"#ef4444", bg:"#fef2f2" },
  media: { label:"Media", color:"#f59e0b", bg:"#fffbeb" },
  baja:  { label:"Baja",  color:"#22c55e", bg:"#f0fdf4" },
};

export const ESTADOS = {
  pendiente:  { label:"Pendiente",  color:"#94a3b8", bg:"#f8fafc" },
  en_curso:   { label:"En curso",   color:"#f59e0b", bg:"#fffbeb" },
  completado: { label:"Completado", color:"#22c55e", bg:"#f0fdf4" },
  bloqueado:  { label:"Bloqueado",  color:"#ef4444", bg:"#fef2f2" },
};
