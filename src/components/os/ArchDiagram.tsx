"use client";

import { motion } from "framer-motion";
import type { ArchDiagram as Spec } from "@/content/work";
import { DUR, EASE } from "@/lib/design";
import { NODE_TINT, OS } from "./theme";

/**
 * Architecture as a first-class citizen.
 *
 * A declarative node/edge renderer — content files describe a system as
 * boxes on a column/row grid and the edges between them, and this draws
 * it. Deliberately not hand-drawn and not animated beyond a single fade:
 * this is a systems diagram in an OS window, so it should look like one
 * an engineer would paste into a design doc.
 *
 * Nodes are tinted by what they are (input, core, store, model, output)
 * rather than by position, so the same colour means the same thing
 * across every project's diagram.
 */

const ROW_H = 74;
const NODE_H = 46;
const MIN_W = 104;
const COL_GAP = 44;
const PAD = 16;
/** Geist Mono advance width at the sizes below — enough to size a box from its text */
const CH_LABEL = 5.25;
const CH_SUB = 4.35;

export function ArchDiagram({ spec }: { spec: Spec }) {
  const maxRow = Math.max(...spec.nodes.map((n) => n.row));
  const maxCol = Math.max(...spec.nodes.map((n) => n.col));

  // Boxes are sized to their text rather than fixed — a diagram whose
  // labels overflow their nodes reads as broken, and these labels are
  // real component names, not something to truncate. Each column is then
  // as wide as its widest node so nothing collides.
  const nodeW = (n: (typeof spec.nodes)[number]) =>
    Math.max(MIN_W, n.label.length * CH_LABEL + 22, (n.sub?.length ?? 0) * CH_SUB + 22);

  const colW: number[] = [];
  for (let c = 0; c <= maxCol; c++) {
    const inCol = spec.nodes.filter((n) => n.col === c);
    colW[c] = inCol.length ? Math.max(...inCol.map(nodeW)) : MIN_W;
  }
  const colX: number[] = [];
  for (let c = 0; c <= maxCol; c++) {
    colX[c] = c === 0 ? PAD : colX[c - 1] + colW[c - 1] + COL_GAP;
  }

  const width = colX[maxCol] + colW[maxCol] + PAD;
  const height = maxRow * ROW_H + NODE_H + PAD * 2;

  const at = (id: string) => {
    const n = spec.nodes.find((x) => x.id === id);
    if (!n) return null;
    return { x: colX[n.col], y: PAD + n.row * ROW_H, w: colW[n.col], h: NODE_H };
  };

  return (
    <figure className="m-0">
      {/* the diagram scrolls on its own axis — the panel never does */}
      <div className="os-scroll overflow-x-auto rounded-md" style={{ background: OS.sunk, border: `1px solid ${OS.lineSoft}` }}>
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label={spec.caption}>
          <defs>
            <marker id="arch-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 1 L 7 4 L 0 7 z" fill={OS.faint} />
            </marker>
          </defs>

          {/* edges first so boxes sit on top of the joins */}
          {spec.edges.map((e, i) => {
            const a = at(e.from);
            const b = at(e.to);
            if (!a || !b) return null;

            // leaving a box on its right edge and entering on the left;
            // a backward edge (re-plan, retry) loops under instead
            const backward = b.x < a.x;
            const x1 = backward ? a.x + a.w / 2 : a.x + a.w;
            const y1 = backward ? a.y + a.h : a.y + a.h / 2;
            const x2 = backward ? b.x + b.w / 2 : b.x;
            const y2 = backward ? b.y + b.h : b.y + b.h / 2;

            const d = backward
              ? `M ${x1} ${y1} C ${x1} ${y1 + 30}, ${x2} ${y2 + 30}, ${x2} ${y2}`
              : `M ${x1} ${y1} C ${x1 + 26} ${y1}, ${x2 - 26} ${y2}, ${x2} ${y2}`;

            const mx = (x1 + x2) / 2;
            const my = backward ? Math.max(y1, y2) + 24 : (y1 + y2) / 2;

            return (
              <g key={`${e.from}-${e.to}-${i}`}>
                <motion.path
                  d={d}
                  fill="none"
                  stroke={OS.faint}
                  strokeWidth={1.1}
                  strokeDasharray={e.dashed ? "3 3" : undefined}
                  markerEnd="url(#arch-arrow)"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 + i * 0.02, duration: DUR.ui, ease: EASE.out }}
                />
                {e.label && (
                  <text
                    x={mx}
                    y={my - 4}
                    textAnchor="middle"
                    fontSize={7}
                    fill={OS.faint}
                    style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                  >
                    {e.label}
                  </text>
                )}
              </g>
            );
          })}

          {spec.nodes.map((n, i) => {
            // every node fills its column, so boxes align on a grid and
            // edges always meet a real box edge
            const p = at(n.id)!;
            const tint = NODE_TINT[n.kind ?? "core"] ?? OS.accent;
            return (
              <motion.g
                key={n.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.025, duration: DUR.ui, ease: EASE.out }}
              >
                <rect
                  x={p.x}
                  y={p.y}
                  width={p.w}
                  height={p.h}
                  rx={6}
                  fill="rgba(255,255,255,0.045)"
                  stroke={`${tint}66`}
                  strokeWidth={1}
                />
                {/* a 2px spine in the node's own colour — the legend key */}
                <rect x={p.x} y={p.y + 8} width={2} height={p.h - 16} rx={1} fill={tint} />
                <text
                  x={p.x + 10}
                  y={n.sub ? p.y + 20 : p.y + p.h / 2 + 3}
                  fontSize={8.5}
                  fill={OS.txt}
                  style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                >
                  {n.label}
                </text>
                {n.sub && (
                  <text
                    x={p.x + 10}
                    y={p.y + 32}
                    fontSize={7}
                    fill={OS.faint}
                    style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                  >
                    {n.sub}
                  </text>
                )}
              </motion.g>
            );
          })}
        </svg>
      </div>
      <figcaption className="mt-1.5 font-mono text-[8px] tracking-[0.16em] uppercase" style={{ color: OS.faint }}>
        {spec.caption}
      </figcaption>
    </figure>
  );
}
