import type { RectificationStatus } from "../../domain/documentDetail";
import { STATUS_LABEL, STATUS_STYLE } from "../../utils/timeline";

export default function BadgeRectificationStatus({ props }: { props: RectificationStatus }) {
  const style = STATUS_STYLE[props.status] ?? STATUS_STYLE.solicitada;

  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "5px",
      padding: "3px 10px",
      background: style.badge,
      color: style.badgeColor,
      border: `1px solid ${style.badgeBorder}`,
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
        background: style.badgeColor,
        flexShrink: 0,
        display: "inline-block",
      }} />
      {STATUS_LABEL[props.status] ?? props.status}
    </span>
  );
}
