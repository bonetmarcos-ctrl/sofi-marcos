/**
 * Modal — wrapper genérico con overlay blur.
 * Cierra al hacer click fuera del contenido.
 */
export default function Modal({ onClose, children, maxW = 460 }) {
  return (
    <div
      onClick={e => e.target === e.currentTarget && onClose()}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(15,15,30,0.55)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000,
        padding: "max(10px, env(safe-area-inset-top)) max(10px, env(safe-area-inset-right)) max(10px, env(safe-area-inset-bottom)) max(10px, env(safe-area-inset-left))",
      }}
    >
      <div style={{
        background: "white", borderRadius: "clamp(14px, 4vw, 20px)", padding: "clamp(16px, 4vw, 24px)",
        width: "100%", maxWidth: maxW, minWidth: 0,
        boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
        maxHeight: "94vh", overflowY: "auto",
      }}>
        {children}
      </div>
    </div>
  );
}
