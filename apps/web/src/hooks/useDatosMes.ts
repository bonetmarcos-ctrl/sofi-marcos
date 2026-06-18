import { useMemo } from "react";
import { calculateDebtInstallmentForMonth, calculateMonthlyBudget } from "@sofi-marqui/domain";
import { CATEGORIAS } from "../constants/categorias.ts";
import { BASE } from "../data/demo.ts";

/**
 * Calcula la cuota de deudas activa para un mes dado ("YYYY-MM").
 * Función pura — extraída aquí para ser reutilizable y testeable.
 */
export const calcCuotaDeudaMes = (deudas, pref, base = BASE) => {
  if (base.monthlyOverrides?.[pref]?.debtExpenses !== undefined) {
    return base.monthlyOverrides[pref].debtExpenses;
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
export const useDatosMes = ({ base = BASE, eventos, bloqueos, viajes, palancas, deudas, suministros, gastosVariables, proyectos, año, mesActual }) => {
  return useMemo(() => calculateMonthlyBudget({
    base,
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
  }), [base, eventos, bloqueos, viajes, palancas, deudas, suministros, gastosVariables, proyectos, año, mesActual]);
};
