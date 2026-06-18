import { useMemo } from "react";
import { calculateDebtInstallmentForMonth, calculateMonthlyBudget } from "@sofi-marqui/domain";
import { CATEGORIAS } from "../constants/categorias.js";
import { BASE } from "../data/demo.js";

/**
 * Calcula la cuota de deudas activa para un mes dado ("YYYY-MM").
 * Función pura — extraída aquí para ser reutilizable y testeable.
 */
export const calcCuotaDeudaMes = (deudas, pref) => {
  return calculateDebtInstallmentForMonth(deudas, pref);
};

/**
 * useDatosMes — hook central de cálculo financiero.
 *
 * Recibe el estado global y devuelve:
 *   - datosMes: array[12] con métricas completas por mes del año en curso
 *   - totales: KPIs globales anuales
 *
 * Todo memoizado — solo recalcula cuando cambian los inputs.
 */
export const useDatosMes = ({ eventos, viajes, palancas, deudas, suministros, año, mesActual }) => {
  return useMemo(() => calculateMonthlyBudget({
    base: BASE,
    categories: CATEGORIAS,
    events: eventos,
    trips: viajes,
    levers: palancas,
    debts: deudas,
    utilities: suministros,
    year: año,
    currentMonth: mesActual,
  }), [eventos, viajes, palancas, deudas, suministros, año, mesActual]);
};
