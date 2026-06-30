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

export const PROYECTO_CATEGORIAS = [
  { id:"general",     label:"General",        emoji:"📌", color:"#6E6385", bg:"#EEE8F4" },
  { id:"compra",      label:"Major purchase", emoji:"🏷️", color:"#2F7F87", bg:"#E6F2F4" },
  { id:"tramite",     label:"Procedure",      emoji:"🗂️", color:"#8F736A", bg:"#F3E8E3" },
  { id:"vivienda",    label:"Home",           emoji:"🏠", color:"#6F9F61", bg:"#EEF7EB" },
  { id:"finanzas",    label:"Finance",        emoji:"€", color:"#4F8F63", bg:"#EEF6EF" },
  { id:"viaje",       label:"Trip",           emoji:"✈️", color:"#2F80A8", bg:"#EAF6FB" },
  { id:"aprendizaje", label:"Learning",       emoji:"🎓", color:"#7c3aed", bg:"#F1F0F7" },
  { id:"trabajo",     label:"Work",           emoji:"💼", color:"#475569", bg:"#F8FAFC" },
  { id:"otro",        label:"Other",          emoji:"📦", color:"#756F7C", bg:"#F8F7F3" },
];

const PROJECT_CATEGORY_IDS = new Set(PROYECTO_CATEGORIAS.map(category => category.id));
const LEGACY_HOME_PROJECT_IDS = new Set(HABITACIONES.map(room => room.id));
type ProjectCategoryInput = Partial<Record<"categoria" | "tipoProyecto" | "habitacion", string | number | null | undefined>>;

export const projectCategoryId = (project: ProjectCategoryInput = {}) => {
  const raw = String(project.categoria || project.tipoProyecto || project.habitacion || "general");
  if (PROJECT_CATEGORY_IDS.has(raw)) return raw;
  if (LEGACY_HOME_PROJECT_IDS.has(raw)) return "vivienda";
  return "general";
};

export const projectCategoryMeta = (project: ProjectCategoryInput = {}) =>
  PROYECTO_CATEGORIAS.find(category => category.id === projectCategoryId(project)) || PROYECTO_CATEGORIAS[0];

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
