import type { Status } from "../../domain/documentDetail"

// ─── Config ──────────────────────────────────────────────────────────────────

interface BadgeCfg {
  bg: string
  color: string
  border: string
  label: string
}

const STATUS_CONFIG: Record<string, BadgeCfg> = {
  confirmado: { bg: "#DCFCE7", color: "#166534", border: "#BBF7D0", label: "Confirmado" },
  aguardando: { bg: "#FEF9C3", color: "#854D0E", border: "#FDE68A", label: "Aguardando" },
  cancelado:  { bg: "#FEE2E2", color: "#991B1B", border: "#FECACA", label: "Cancelado"  },
}

// ─── BadgeStatusDetail ───────────────────────────────────────────────────────

export default function BadgeStatusDetail({ props }: { props: Status }) {
  const cfg: BadgeCfg = STATUS_CONFIG[props.status] ?? {
    bg: "#F3F4F6", color: "#6B7280", border: "#E5E7EB", label: props.status,
  }

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
      {cfg.label}
    </span>
  )
}
