// ─── Config ──────────────────────────────────────────────────────────────────

interface DaysCfg {
  bg: string
  color: string
  border: string
  suffix: string
}

function getDaysConfig(days: number): DaysCfg {
  if (days <= 7) {
    return { bg: "#DCFCE7", color: "#166534", border: "#BBF7D0", suffix: " — normal" }
  }
  if (days <= 15) {
    return { bg: "#FEF9C3", color: "#854D0E", border: "#FDE68A", suffix: " — atenção" }
  }
  return { bg: "#FEE2E2", color: "#991B1B", border: "#FECACA", suffix: " — atrasado" }
}

// ─── BadgeDaysAwaiting ───────────────────────────────────────────────────────

export default function BadgeDaysAwaiting({ days }: { days: number }) {
  const cfg = getDaysConfig(days)
  const plural = days === 1 ? "dia" : "dias"

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      padding: "3px 10px",
      background: cfg.bg,
      color: cfg.color,
      border: `1px solid ${cfg.border}`,
      borderRadius: "9999px",
      fontSize: "11px",
      fontWeight: "600",
      whiteSpace: "nowrap",
      lineHeight: 1.5,
    }}>
      <span style={{
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        background: cfg.color,
        flexShrink: 0,
        display: "inline-block",
      }} />
      {days} {plural}{cfg.suffix}
    </span>
  )
}
