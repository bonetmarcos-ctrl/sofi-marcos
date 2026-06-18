export const HABITACIONES = [
  { id:"salon",     label:"Living room", emoji:"🛋️", color:"#7c3aed" },
  { id:"cocina",    label:"Kitchen",     emoji:"🍳", color:"#ea580c" },
  { id:"dormi",     label:"Bedroom",     emoji:"🛏️", color:"#059669" },
  { id:"bano",      label:"Bathroom",    emoji:"🚿", color:"#0891b2" },
  { id:"huespedes", label:"Guest room",  emoji:"🏠", color:"#8b5cf6" },
  { id:"terraza",   label:"Terrace",     emoji:"🌿", color:"#16a34a" },
  { id:"entrada",   label:"Entry",       emoji:"🚪", color:"#b45309" },
  { id:"otro",      label:"Other",       emoji:"📦", color:"#475569" },
];

export const PRIORIDADES = {
  alta:  { label:"High",   color:"#ef4444", bg:"#fef2f2" },
  media: { label:"Medium", color:"#f59e0b", bg:"#fffbeb" },
  baja:  { label:"Low",    color:"#22c55e", bg:"#f0fdf4" },
};

export const ESTADOS = {
  pendiente:  { label:"Pending",     color:"#94a3b8", bg:"#f8fafc" },
  en_curso:   { label:"In progress", color:"#f59e0b", bg:"#fffbeb" },
  completado: { label:"Done",        color:"#22c55e", bg:"#f0fdf4" },
  bloqueado:  { label:"Blocked",     color:"#ef4444", bg:"#fef2f2" },
};
