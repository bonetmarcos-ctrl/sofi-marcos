import { C } from "../constants/colores.ts";
import { useI18n } from "../i18n.tsx";

export const LanguageMenu = ({ compact = false }: { compact?: boolean }) => {
  const { language, languages, setLanguage, t } = useI18n();

  return (
    <label title={t("Language")} style={{ display:"flex", alignItems:"center", gap:6, color:"rgba(255,255,255,0.72)", fontSize:12, fontWeight:700 }}>
      {!compact && <span>{t("Language")}</span>}
      <select
        aria-label={t("Language")}
        value={language}
        onChange={(event) => setLanguage(event.target.value as typeof language)}
        style={{
          minHeight:32,
          border:"1px solid rgba(255,255,255,0.25)",
          borderRadius:10,
          background:"rgba(255,255,255,0.08)",
          color:"white",
          padding:"7px 28px 7px 10px",
          fontSize:12,
          fontWeight:800,
          fontFamily:"'Lato',sans-serif",
          cursor:"pointer",
          outline:"none",
          maxWidth:compact ? 78 : 132,
          colorScheme:"dark",
        }}
      >
        {languages.map((option) => (
          <option key={option.code} value={option.code} style={{ background:C.txt, color:"white" }}>
            {compact ? option.shortLabel : option.label}
          </option>
        ))}
      </select>
    </label>
  );
};