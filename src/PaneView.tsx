import { useRef, useCallback } from "react";
import type { Pane } from "./paneTree";

type Props = {
  pane: Pane;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onResize: (splitId: string, ratio: number) => void;
};

export function PaneView({ pane, selectedId, onSelect, onResize }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <PaneNode
        pane={pane}
        selectedId={selectedId}
        onSelect={onSelect}
        onResize={onResize}
      />
    </div>
  );
}

function PaneNode({ pane, selectedId, onSelect, onResize }: Props) {
  if (pane.kind === "leaf") {
    const isSelected = pane.id === selectedId;
    return (
      <button
        type="button"
        onClick={() => onSelect(pane.id)}
        className={`absolute inset-0 m-1 rounded-md text-left transition-all ${
          isSelected
            ? "bg-accent/10 border-2 border-accent shadow-[0_0_0_1px_rgba(124,247,168,0.15),0_8px_24px_-8px_rgba(124,247,168,0.35)]"
            : "bg-ink/60 border border-line hover:border-muted"
        }`}
      >
        <div className="absolute inset-0 flex flex-col items-start justify-start p-3 gap-1.5">
          <div className="flex items-center gap-1.5">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isSelected ? "bg-accent" : "bg-muted"
              }`}
            />
            <span className="text-[10px] uppercase tracking-wider font-mono text-muted">
              pane
            </span>
          </div>
          {pane.command && (
            <span className="font-mono text-[11px] text-[#c8ccd6] max-w-full truncate">
              $ {pane.command}
            </span>
          )}
        </div>
      </button>
    );
  }

  const isHorizontal = pane.direction === "h";
  const aStyle = isHorizontal
    ? { left: 0, top: 0, width: `${pane.ratio * 100}%`, height: "100%" }
    : { left: 0, top: 0, width: "100%", height: `${pane.ratio * 100}%` };
  const bStyle = isHorizontal
    ? {
        left: `${pane.ratio * 100}%`,
        top: 0,
        width: `${(1 - pane.ratio) * 100}%`,
        height: "100%",
      }
    : {
        left: 0,
        top: `${pane.ratio * 100}%`,
        width: "100%",
        height: `${(1 - pane.ratio) * 100}%`,
      };

  return (
    <>
      <div className="absolute" style={aStyle}>
        <PaneNode
          pane={pane.a}
          selectedId={selectedId}
          onSelect={onSelect}
          onResize={onResize}
        />
      </div>
      <div className="absolute" style={bStyle}>
        <PaneNode
          pane={pane.b}
          selectedId={selectedId}
          onSelect={onSelect}
          onResize={onResize}
        />
      </div>
      <Divider
        direction={pane.direction}
        ratio={pane.ratio}
        onChange={(r) => onResize(pane.id, r)}
      />
    </>
  );
}

function Divider(props: {
  direction: "h" | "v";
  ratio: number;
  onChange: (r: number) => void;
}) {
  const startDrag = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const parent = (e.currentTarget as HTMLElement).parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();

      const onMove = (ev: MouseEvent) => {
        const ratio =
          props.direction === "h"
            ? (ev.clientX - rect.left) / rect.width
            : (ev.clientY - rect.top) / rect.height;
        props.onChange(Math.max(0.1, Math.min(0.9, ratio)));
      };
      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
    },
    [props]
  );

  const isH = props.direction === "h";
  const style: React.CSSProperties = isH
    ? {
        position: "absolute",
        left: `calc(${props.ratio * 100}% - 4px)`,
        top: 0,
        width: 8,
        height: "100%",
        cursor: "col-resize",
        zIndex: 10,
      }
    : {
        position: "absolute",
        top: `calc(${props.ratio * 100}% - 4px)`,
        left: 0,
        height: 8,
        width: "100%",
        cursor: "row-resize",
        zIndex: 10,
      };

  return (
    <div
      onMouseDown={startDrag}
      style={style}
      className="group"
    >
      <div
        className={`absolute bg-line group-hover:bg-accent/60 transition ${
          isH
            ? "left-1/2 -translate-x-1/2 top-0 w-[2px] h-full"
            : "top-1/2 -translate-y-1/2 left-0 h-[2px] w-full"
        }`}
      />
    </div>
  );
}
