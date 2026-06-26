import { FUNDING_SOURCES } from "@sofi-marqui/domain";

export const PAYMENT_METHOD_OPTIONS = [
  { key:FUNDING_SOURCES.MONTH_INCOME, labelKey:"Cash", detailKey:"This month", icon:"💶" },
  { key:FUNDING_SOURCES.CREDIT_NEXT_MONTH, labelKey:"Card", detailKey:"Debit month", icon:"💳" },
  { key:FUNDING_SOURCES.CREDIT_INSTALLMENTS, labelKey:"Credit card installments", detailKey:"Installments", icon:"🧾" },
];

export const paymentMethodLabelKey = (source) => PAYMENT_METHOD_OPTIONS.find(option => option.key === source)?.labelKey || "Cash";

export const paymentMethodIcon = (source) => PAYMENT_METHOD_OPTIONS.find(option => option.key === source)?.icon || "💶";