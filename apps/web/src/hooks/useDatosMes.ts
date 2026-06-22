import { useMemo } from "react";
import { calculateDebtInstallmentForMonth, calculateMonthlyBudget, isLinkedCardInstallmentDebt } from "@sofi-marqui/domain";
import { CATEGORIAS } from "../constants/categorias.ts";
import { BASE } from "../data/demo.ts";

/**
 * Calcula la cuota de deudas activa para un mes dado ("YYYY-MM").
 * Función pura — extraída aquí para ser reutilizable y testeable.
 */
export const calcCuotaDeudaMes = (deudas, pref) => {
  if (BASE.monthlyOverrides?.[pref]?.debtExpenses !== undefined) {
    return BASE.monthlyOverrides[pref].debtExpenses + calculateDebtInstallmentForMonth(deudas.filter(isLinkedCardInstallmentDebt), pref);
  }

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
export const useDatosMes = ({ eventos, bloqueos, viajes, palancas, deudas, suministros, gastosVariables, proyectos, año, mesActual }) => {
  return useMemo(() => calculateMonthlyBudget({
    base: BASE,
    categories: CATEGORIAS,
    events: eventos,
    blocks: bloqueos,
    trips: viajes,
    levers: palancas,
    debts: deudas,
    utilities: suministros,
    variableExpenses: gastosVariables,
    projects: proyectos,
    year: año,
    currentMonth: mesActual,
  }), [eventos, bloqueos, viajes, palancas, deudas, suministros, gastosVariables, proyectos, año, mesActual]);
};
