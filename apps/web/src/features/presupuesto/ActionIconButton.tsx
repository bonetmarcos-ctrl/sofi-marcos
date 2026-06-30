import type { CSSProperties, ReactNode } from "react";
import { C } from "../../constants/colores.ts";

const toneStyles = {
  edit: { background:"white", border:C.borde, color:C.txt2 },
  neutral: { background:C.fondo, border:C.borde, color:C.txt2 },
  delete: { background:C.errorBg, border:`${C.error}44`, color:C.error },
};

export default function ActionIconButton({ label, icon, bootstrapIcon, onClick, tone = "neutral", size = 28, style, disabled = false }: {
  label: string;
  icon?: ReactNode;
  bootstrapIcon?: string;
  onClick: () => void;
  tone?: keyof typeof toneStyles;
  size?: number;
  style?: CSSProperties;
  disabled?: boolean;
}) {
  const toneStyle = toneStyles[tone];

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      style={{
        width:size,
        height:size,
        minWidth:size,
        minHeight:size,
        borderRadius:8,
        border:`1px solid ${toneStyle.border}`,
        background:toneStyle.background,
        color:toneStyle.color,
        cursor:disabled?"not-allowed":"pointer",
        opacity:disabled?0.5:1,
        display:"inline-flex",
        alignItems:"center",
        justifyContent:"center",
        flexShrink:0,
        fontFamily:"'Lato',sans-serif",
        fontSize:13,
        fontWeight:800,
        lineHeight:1,
        padding:0,
        ...style,
      }}
    >
      {icon ?? (bootstrapIcon ? <i className={`bi bi-${bootstrapIcon}`} aria-hidden="true" /> : null)}
    </button>
  );
}