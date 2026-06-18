import { z } from "zod";

const idSchema = z.union([z.string(), z.number()]);
const optionalText = z.string().optional().default("");
const amount = z.coerce.number().finite().default(0);

export const eventSchema = z.object({
  id: idSchema.optional(),
  fecha: z.string().min(1),
  titulo: z.string().min(1),
  hora: optionalText,
  categoria: z.string().min(1),
  importe: amount,
  notas: optionalText,
  persona: z.string().optional(),
  huespedes: z.string().optional(),
  noches: z.coerce.number().optional(),
  precioPorNoche: z.coerce.number().optional(),
  diasAlquiler: z.coerce.number().optional(),
});

export const tripSchema = z.object({
  id: idSchema.optional(),
  nombre: z.string().min(1),
  inicio: z.string().min(1),
  fin: z.string().min(1),
  presupuesto: amount,
  color: z.string().optional(),
  emoji: z.string().optional(),
  notas: optionalText,
  gastos: z.record(amount).default({}),
});

export const blockSchema = z.object({
  id: idSchema.optional(),
  tipo: z.enum(["habitacion", "coche"]),
  inicio: z.string().min(1),
  fin: z.string().min(1),
  nota: optionalText,
  importe: amount,
});

export const projectSchema = z.object({
  id: idSchema.optional(),
  habitacion: z.string().min(1),
  titulo: z.string().min(1),
  descripcion: optionalText,
  prioridad: z.string().min(1),
  estado: z.string().min(1),
  inicio: z.string().min(1),
  fin: z.string().min(1),
  presupuesto: amount,
  gasto: amount,
  notas: optionalText,
});

export const leverSchema = z.object({
  id: idSchema.optional(),
  nombre: z.string().min(1),
  subcategoria: z.string().min(1),
  importe: amount,
  mes: z.string().min(1),
  activa: z.coerce.boolean().default(false),
  notas: optionalText,
});

export const debtSchema = z.object({
  id: idSchema.optional(),
  nombre: z.string().min(1),
  tipo: z.string().default("cuotas"),
  cuota: amount,
  interes_mensual: amount,
  cuotas_totales: z.coerce.number().int().nonnegative(),
  cuota_actual: z.coerce.number().int().nonnegative().default(0),
  mes_inicio: z.string().min(1),
  notas: optionalText,
});

export const utilitySchema = z.object({
  id: idSchema.optional(),
  mes: z.string().min(1),
  tipo: z.string().min(1),
  importe: amount,
  notas: optionalText,
});

export const variableExpenseSchema = z.object({
  id: idSchema.optional(),
  mes: z.string().min(1),
  titulo: z.string().min(1),
  categoria: z.string().min(1),
  importe: amount,
  notas: optionalText,
});

export const collectionSchemas = {
  eventos: eventSchema,
  viajes: tripSchema,
  bloqueos: blockSchema,
  proyectos: projectSchema,
  palancas: leverSchema,
  deudas: debtSchema,
  suministros: utilitySchema,
  gastosVariables: variableExpenseSchema,
};

export const collectionNames = Object.freeze(Object.keys(collectionSchemas));