import { useMemo, useState, useCallback } from "react";
import {
  type Pane,
  initialTree,
  splitPane,
  removePane,
  setRatio,
  setLeafCommand,
  findLeaf,
  countLeaves,
  generateScript,
} from "./paneTree";
import { PaneView } from "./PaneView";

function App() {
  const [tree, setTree] = useState<Pane>(() => initialTree());
  const [selectedId, setSelectedId] = useState<string | null>(tree.id);
  const [sessionName, setSessionName] = useState("main");
  const [tmuxPath, setTmuxPath] = useState("/opt/homebrew/bin/tmux");
  const [installId, setInstallId] = useState("brew");
  const [copied, setCopied] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<"script" | "howto">("script");

  const handleInstallChange = useCallback(
    (opt: InstallOption) => {
      setInstallId(opt.id);
      setTmuxPath((prev) => (KNOWN_PATHS.has(prev) ? opt.path : prev));
    },
    []
  );

  const selectedLeaf = useMemo(
    () => (selectedId ? findLeaf(tree, selectedId) : null),
    [tree, selectedId]
  );

  const script = useMemo(
    () => generateScript({ sessionName, tree, tmuxPath }),
    [sessionName, tree, tmuxPath]
  );

  const leafCount = useMemo(() => countLeaves(tree), [tree]);

  const handleSplit = useCallback(
    (dir: "h" | "v") => {
      if (!selectedId) return;
      const leaf = findLeaf(tree, selectedId);
      if (!leaf) return;
      const nextTree = splitPane(tree, selectedId, dir);
      setTree(nextTree);
    },
    [tree, selectedId]
  );

  const handleDelete = useCallback(() => {
    if (!selectedId) return;
    if (leafCount <= 1) return;
    const next = removePane(tree, selectedId);
    if (!next) return;
    setTree(next);
    setSelectedId(next.kind === "leaf" ? next.id : findFirstLeafId(next));
  }, [tree, selectedId, leafCount]);

  const handleReset = useCallback(() => {
    const t = initialTree();
    setTree(t);
    setSelectedId(t.id);
  }, []);

  const handleResize = useCallback(
    (splitId: string, ratio: number) => {
      setTree((t) => setRatio(t, splitId, ratio));
    },
    []
  );

  const handleCommandChange = useCallback(
    (cmd: string) => {
      if (!selectedId) return;
      setTree((t) => setLeafCommand(t, selectedId, cmd));
    },
    [selectedId]
  );

  const copy = async () => {
    await navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };

  const download = () => {
    const safe = (sessionName || "main").replace(/[^a-zA-Z0-9_-]/g, "_");
    const blob = new Blob([script], { type: "text/x-shellscript" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tmux-${safe}.sh`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full w-full flex flex-col">
      <header className="flex items-center justify-between px-6 py-4 border-b border-line">
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-semibold tracking-tight">tmux-grid</h1>
          <span className="text-xs text-muted font-mono">
            visual layout builder → .sh
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <kbd className="px-1.5 py-0.5 rounded bg-panel border border-line font-mono">
            click
          </kbd>
          <span>to select</span>
          <span className="text-line">·</span>
          <kbd className="px-1.5 py-0.5 rounded bg-panel border border-line font-mono">
            drag divider
          </kbd>
          <span>to resize</span>
          <span className="text-line mx-1">·</span>
          <a
            href="https://x.com/HeyItzaMi"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 font-mono hover:text-accent transition"
          >
            <XIcon />
            <span>@HeyItzaMi</span>
          </a>
        </div>
      </header>

      <main className="flex-1 flex min-h-0">
        <section className="flex-1 flex flex-col min-w-0 border-r border-line">
          <Toolbar
            onSplitH={() => handleSplit("h")}
            onSplitV={() => handleSplit("v")}
            onDelete={handleDelete}
            onReset={handleReset}
            canDelete={leafCount > 1 && !!selectedId}
            leafCount={leafCount}
          />

          <div className="flex-1 p-6 min-h-0">
            <div className="h-full w-full rounded-lg border border-line bg-panel overflow-hidden relative">
              <PaneView
                pane={tree}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onResize={handleResize}
              />
            </div>
          </div>

          {selectedLeaf && (
            <div className="px-6 pb-5">
              <label className="block text-[11px] uppercase tracking-wider text-muted mb-2">
                Command for selected pane
              </label>
              <input
                type="text"
                placeholder="e.g. nvim ., npm run dev, htop"
                value={selectedLeaf.command ?? ""}
                onChange={(e) => handleCommandChange(e.target.value)}
                className="w-full bg-ink border border-line rounded-md px-3 py-2 font-mono text-sm outline-none focus:border-accent/60 transition"
              />
            </div>
          )}
        </section>

        <aside className="w-[480px] flex flex-col min-h-0">
          <div className="px-6 py-4 border-b border-line space-y-3">
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-muted mb-1.5">
                Session name
              </label>
              <input
                type="text"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                className="w-full bg-ink border border-line rounded-md px-3 py-2 font-mono text-sm outline-none focus:border-accent/60 transition"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-muted mb-1.5">
                Install source
              </label>
              <InstallTabs
                active={installId}
                onChange={handleInstallChange}
                compact
              />
              <input
                type="text"
                value={tmuxPath}
                onChange={(e) => setTmuxPath(e.target.value)}
                className="mt-2 w-full bg-ink border border-line rounded-md px-3 py-1.5 font-mono text-[12px] text-[#c8ccd6] outline-none focus:border-accent/60 transition"
              />
            </div>
          </div>

          <div className="px-6 pt-4 pb-3 border-b border-line">
            <div className="flex p-1 bg-ink rounded-md border border-line">
              <TabButton
                active={sidebarTab === "script"}
                onClick={() => setSidebarTab("script")}
              >
                Script
              </TabButton>
              <TabButton
                active={sidebarTab === "howto"}
                onClick={() => setSidebarTab("howto")}
              >
                How to use
              </TabButton>
            </div>
          </div>

          {sidebarTab === "script" ? (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-end gap-2 px-6 py-3 border-b border-line">
                <button
                  onClick={copy}
                  className="text-xs font-mono px-2.5 py-1 rounded border border-line bg-panel hover:border-accent/60 transition"
                >
                  {copied ? "copied" : "copy"}
                </button>
                <button
                  onClick={download}
                  className="text-xs font-mono px-2.5 py-1 rounded bg-accent text-ink hover:brightness-110 transition font-semibold"
                >
                  download .sh
                </button>
              </div>
              <pre className="flex-1 overflow-auto px-6 py-4 font-mono text-[12.5px] leading-relaxed text-[#c8ccd6] whitespace-pre">
                {script}
              </pre>
            </div>
          ) : (
            <HowToUse
              sessionName={sessionName}
              installId={installId}
              onInstallChange={handleInstallChange}
              tmuxPath={tmuxPath}
              onTmuxPathChange={setTmuxPath}
            />
          )}
        </aside>
      </main>
    </div>
  );
}

function Toolbar(props: {
  onSplitH: () => void;
  onSplitV: () => void;
  onDelete: () => void;
  onReset: () => void;
  canDelete: boolean;
  leafCount: number;
}) {
  return (
    <div className="flex items-center gap-2 px-6 py-3 border-b border-line">
      <button
        onClick={props.onSplitH}
        className="group flex items-center gap-2 text-sm px-3 py-1.5 rounded-md border border-line bg-panel hover:border-accent/60 transition"
      >
        <SplitHIcon />
        Split right
      </button>
      <button
        onClick={props.onSplitV}
        className="group flex items-center gap-2 text-sm px-3 py-1.5 rounded-md border border-line bg-panel hover:border-accent/60 transition"
      >
        <SplitVIcon />
        Split down
      </button>
      <div className="flex-1" />
      <span className="text-xs text-muted font-mono">
        {props.leafCount} pane{props.leafCount === 1 ? "" : "s"}
      </span>
      <button
        onClick={props.onDelete}
        disabled={!props.canDelete}
        className="text-sm px-3 py-1.5 rounded-md border border-line bg-panel hover:border-red-500/60 disabled:opacity-30 disabled:hover:border-line transition"
      >
        Delete
      </button>
      <button
        onClick={props.onReset}
        className="text-sm px-3 py-1.5 rounded-md border border-line bg-panel hover:border-accent/60 transition"
      >
        Reset
      </button>
    </div>
  );
}

function SplitHIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect
        x="1"
        y="1"
        width="12"
        height="12"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <line x1="7" y1="1" x2="7" y2="13" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function SplitVIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <rect
        x="1"
        y="1"
        width="12"
        height="12"
        rx="1.5"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <line x1="1" y1="7" x2="13" y2="7" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2H21.5l-7.5 8.57L22.75 22h-6.84l-5.36-6.98L4.32 22H1.06l8.02-9.16L1.5 2h7l4.84 6.36L18.244 2Zm-1.2 18h1.9L7.04 4H5.05l11.994 16Z" />
    </svg>
  );
}

function findFirstLeafId(pane: Pane): string {
  if (pane.kind === "leaf") return pane.id;
  return findFirstLeafId(pane.a);
}

function TabButton(props: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={props.onClick}
      className={`flex-1 px-3 py-1.5 rounded text-[12px] font-mono transition ${
        props.active
          ? "bg-panel text-accent shadow-[0_1px_0_rgba(255,255,255,0.03)]"
          : "text-muted hover:text-[#c8ccd6]"
      }`}
    >
      {props.children}
    </button>
  );
}

function HowToUse(props: {
  sessionName: string;
  installId: string;
  onInstallChange: (opt: InstallOption) => void;
  tmuxPath: string;
  onTmuxPathChange: (v: string) => void;
}) {
  const safe = (props.sessionName || "main").replace(/[^a-zA-Z0-9_-]/g, "_");
  const scriptName = `tmux-${safe}.sh`;
  const installCmd =
    (INSTALL_OPTIONS.find((o) => o.id === props.installId) ?? INSTALL_OPTIONS[0])
      .cmd;

  return (
    <div className="flex-1 overflow-auto">
      <div className="px-6 py-5 text-[13px] leading-relaxed text-[#b8bcc7] space-y-4">
          <Step n={1} title="Install tmux (once)">
            <Code>{installCmd}</Code>
            <p className="text-muted text-[12px] mt-1.5">
              Change the source above to see the right command for your system.
            </p>
          </Step>

          <Step n={2} title="Save & make executable">
            Download the script, then:
            <Code>{`mv ~/Downloads/${scriptName} ~/${scriptName}\nchmod +x ~/${scriptName}`}</Code>
          </Step>

          <Step n={3} title="Run it">
            <Code>~/{scriptName}</Code>
            <p className="text-muted text-[12px] mt-1.5">
              Re-running attaches to the existing session instead of
              recreating it.
            </p>
          </Step>

          <Step n={4} title="Auto-launch in Ghostty (optional)">
            Add this line to{" "}
            <code className="text-[#c8ccd6]">~/.config/ghostty/config</code>:
            <Code>{`command = /bin/sh ${"~"}/${scriptName}`}</Code>
            <p className="text-muted text-[12px] mt-1.5">
              Ghostty will open straight into your layout on launch.
            </p>
          </Step>

        <div className="pt-2 border-t border-line/60 text-[12px] text-muted">
          <span className="font-mono">ctrl+b d</span> to detach ·{" "}
          <span className="font-mono">ctrl+b z</span> to zoom ·{" "}
          <span className="font-mono">ctrl+b arrow</span> to navigate
        </div>
      </div>
    </div>
  );
}

function Step(props: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="w-4 h-4 rounded-full bg-accent/15 text-accent text-[10px] font-mono flex items-center justify-center font-semibold">
          {props.n}
        </span>
        <span className="text-[#e6e8ee] font-medium text-[13px]">
          {props.title}
        </span>
      </div>
      <div className="pl-6">{props.children}</div>
    </div>
  );
}

function Code({ children }: { children: React.ReactNode }) {
  return (
    <pre className="mt-1.5 bg-ink border border-line rounded-md px-3 py-2 font-mono text-[12px] text-[#c8ccd6] whitespace-pre-wrap break-all">
      {children}
    </pre>
  );
}

type InstallOption = {
  id: string;
  label: string;
  cmd: string;
  path: string;
};

const INSTALL_OPTIONS: InstallOption[] = [
  {
    id: "brew",
    label: "macOS · brew",
    cmd: "brew install tmux",
    path: "/opt/homebrew/bin/tmux",
  },
  {
    id: "brew-intel",
    label: "macOS · brew (Intel)",
    cmd: "brew install tmux",
    path: "/usr/local/bin/tmux",
  },
  {
    id: "port",
    label: "macOS · port",
    cmd: "sudo port install tmux",
    path: "/opt/local/bin/tmux",
  },
  {
    id: "apt",
    label: "Debian · apt",
    cmd: "sudo apt install tmux",
    path: "/usr/bin/tmux",
  },
  {
    id: "dnf",
    label: "Fedora · dnf",
    cmd: "sudo dnf install tmux",
    path: "/usr/bin/tmux",
  },
  {
    id: "pacman",
    label: "Arch · pacman",
    cmd: "sudo pacman -S tmux",
    path: "/usr/bin/tmux",
  },
];

const KNOWN_PATHS = new Set(INSTALL_OPTIONS.map((o) => o.path));

function InstallTabs({
  active,
  onChange,
  compact = false,
}: {
  active: string;
  onChange: (opt: InstallOption) => void;
  compact?: boolean;
}) {
  const current =
    INSTALL_OPTIONS.find((o) => o.id === active) ?? INSTALL_OPTIONS[0];

  return (
    <div>
      <div className="flex flex-wrap gap-1 mb-2">
        {INSTALL_OPTIONS.map((opt) => (
          <button
            key={opt.id}
            onClick={() => onChange(opt)}
            className={`text-[11px] font-mono px-2 py-1 rounded border transition ${
              active === opt.id
                ? "border-accent/60 bg-accent/10 text-accent"
                : "border-line bg-panel text-muted hover:text-[#c8ccd6] hover:border-muted"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {!compact && <Code>{current.cmd}</Code>}
    </div>
  );
}

export default App;
