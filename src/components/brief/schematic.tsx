import type { ArchDiagram } from "@/content/work";

/**
 * A project's real architecture, reduced to line art.
 *
 * Same nodes and edges as the full diagram on the case study, drawn as
 * points and hairline curves with no labels — so a cover is a picture of
 * the actual system, not a stock image or an invented illustration. The
 * node kinds survive as shape: stores are squares, models are rings,
 * everything else is a dot.
 */
export function Schematic({
  spec,
  className,
}: {
  spec: ArchDiagram;
  className?: string;
}) {
  const maxCol = Math.max(...spec.nodes.map((n) => n.col), 1);
  const maxRow = Math.max(...spec.nodes.map((n) => n.row), 1);
  const W = 400;
  const H = 260;
  const PX = 28;
  const PY = 30;
  const pos = (id: string) => {
    const n = spec.nodes.find((x) => x.id === id);
    if (!n) return null;
    return {
      x: PX + (n.col / maxCol) * (W - PX * 2),
      y: PY + (n.row / maxRow) * (H - PY * 2),
    };
  };

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      {spec.edges.map((e, i) => {
        const a = pos(e.from);
        const b = pos(e.to);
        if (!a || !b) return null;
        const dx = Math.max(Math.abs(b.x - a.x) * 0.5, 24);
        const back = b.x < a.x;
        const d = back
          ? `M ${a.x} ${a.y} C ${a.x} ${a.y + 70}, ${b.x} ${b.y + 70}, ${b.x} ${b.y}`
          : `M ${a.x} ${a.y} C ${a.x + dx} ${a.y}, ${b.x - dx} ${b.y}, ${b.x} ${b.y}`;
        return (
          <path
            key={i}
            d={d}
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeOpacity={e.dashed ? 0.35 : 0.55}
            strokeDasharray={e.dashed ? "3 4" : undefined}
            vectorEffect="non-scaling-stroke"
          />
        );
      })}
      {spec.nodes.map((n) => {
        const p = pos(n.id)!;
        if (n.kind === "store")
          return (
            <rect
              key={n.id}
              x={p.x - 4.5}
              y={p.y - 4.5}
              width="9"
              height="9"
              fill="currentColor"
            />
          );
        if (n.kind === "model")
          return (
            <circle
              key={n.id}
              cx={p.x}
              cy={p.y}
              r="6.5"
              fill="var(--cover-bg, #fff)"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          );
        return (
          <circle key={n.id} cx={p.x} cy={p.y} r="4" fill="currentColor" />
        );
      })}
    </svg>
  );
}
