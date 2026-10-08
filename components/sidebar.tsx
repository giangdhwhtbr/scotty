"use client";
import * as React from "react";
import { Icon } from "@/components/icons";
import { useTheme } from "@/components/theme-provider";
import { useApp, type View } from "@/components/app-context";
import { ProjectSwitcher } from "@/components/project-switcher";
import { useSidebarCollapsed } from "@/hooks/use-sidebar-collapsed";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { initials, avatarColor, needsHuman, readyHumanGate } from "@/lib/beads-view";
import { useGamification } from "@/hooks/use-beads";
// GITHUB_REPO is shared with the build badge (where bug/feature issues are filed).
import { GITHUB_REPO } from "@/lib/build-info";
import { BuildBadge } from "@/components/build-badge";
import { UpdateIndicator } from "@/components/update-indicator";
import { cn } from "@/lib/utils";

function githubIssueUrl(kind: "bug" | "feature"): string {
  const isBug = kind === "bug";
  const params = new URLSearchParams({
    title: isBug ? "[Bug] " : "[Feature] ",
    labels: isBug ? "bug" : "enhancement",
    body: isBug
      ? "## Steps to reproduce\n\n1. \n2. \n\n## Expected\n\n## Actual\n\n---\n_Filed from Bead Me Up, Scotty_"
      : "## Problem\n\n## Proposed solution\n\n---\n_Filed from Bead Me Up, Scotty_",
  });
  return `https://github.com/${GITHUB_REPO}/issues/new?${params.toString()}`;
}

function openIssue(kind: "bug" | "feature") {
  window.open(githubIssueUrl(kind), "_blank", "noopener,noreferrer");
}

const NAV: { key: View; label: string; icon: string }[] = [
  { key: "focus", label: "Focus", icon: "bolt" },
  { key: "board", label: "Board", icon: "board" },
  { key: "list", label: "List", icon: "list" },
  { key: "epics", label: "Epics", icon: "target" },
  { key: "graph", label: "Graph", icon: "graph" },
  { key: "insights", label: "Insights", icon: "milestone" },
  { key: "activity", label: "Activity", icon: "comment" },
  { key: "needsyou", label: "Needs You", icon: "user" },
  { key: "achievements", label: "Achievements", icon: "feature" },
  { key: "publish", label: "Publish", icon: "rocket" },
  { key: "settings", label: "Settings", icon: "settings" },
];

export function Sidebar({
  view,
  onView,
  kind,
  projectId,
  live,
}: {
  view: View;
  onView: (v: View) => void;
  kind?: "bd" | "demo";
  projectId: string;
  live?: boolean;
}) {
  const { mode, toggle } = useTheme();
  const { meta, beads, index } = useApp();
  const { collapsed, save: saveCollapsed } = useSidebarCollapsed();
  const actor = meta?.humanActor ?? "you";
  const epicCount = beads.filter((b) => b.issue_type === "epic").length;
  // "Needs You" = agent-flagged beads (bd human) + ready human-approval gates.
  const needsYouCount =
    beads.filter(needsHuman).length + beads.filter((b) => readyHumanGate(b, index)).length;
  const game = useGamification(projectId, !!meta?.gamification);

  return (
    <aside
      data-collapsed={collapsed ? "true" : undefined}
      className={cn(
        "flex flex-shrink-0 flex-col border-r border-border bg-[var(--surface)]",
        collapsed ? "w-[60px] p-[18px_8px]" : "w-[228px] p-[18px_14px]",
      )}
    >
      <div
        className={cn(
          "flex items-center",
          collapsed ? "flex-col gap-[10px] pb-[14px] pt-1" : "gap-[10px] pb-[18px] pt-1",
        )}
      >
        <div
          className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-[9px] text-white"
          style={{ background: "var(--brand)", boxShadow: "0 2px 8px -2px var(--brand)" }}
        >
          <Icon name="logo" size={17} />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1 whitespace-nowrap text-[13px] font-[650] leading-[1.15] tracking-[-.01em]">
            Bead Me Up Scotty
          </div>
        )}
        <button
          onClick={() => saveCollapsed(!collapsed)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="flex h-[26px] w-[26px] flex-shrink-0 items-center justify-center rounded-lg border border-border bg-[var(--surface)] text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
        >
          <Icon name="chevron" size={14} className={collapsed ? "-rotate-90" : "rotate-90"} />
        </button>
      </div>

      <ProjectSwitcher
        projectId={projectId}
        kind={kind}
        live={live}
        collapsed={collapsed}
      />


      <nav className="flex flex-col gap-[2px]">
        {NAV.filter((n) => n.key !== "achievements" || meta?.gamification).map((n) => {
          const active = view === n.key;
          return (
            <button
              key={n.key}
              onClick={() => onView(n.key)}
              title={collapsed ? n.label : undefined}
              aria-label={n.label}
              className={cn(
                "flex w-full items-center rounded-[9px] transition-colors",
                collapsed
                  ? "relative h-9 justify-center"
                  : "gap-[10px] px-[10px] py-2 text-left text-[13.5px]",
                active
                  ? "bg-[var(--brand-weak)] font-semibold text-[var(--brand)]"
                  : "font-medium text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]",
              )}
            >
              <Icon name={n.icon} size={17} className="flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1">{n.label}</span>
                  {n.key === "epics" && epicCount > 0 && (
                    <span className="font-mono text-[11px] text-[var(--text-3)]">{epicCount}</span>
                  )}
                  {n.key === "needsyou" && needsYouCount > 0 && (
                    <span
                      className="min-w-[18px] rounded-full px-[6px] py-px text-center text-[11px] font-semibold text-white"
                      style={{ background: "var(--brand)" }}
                    >
                      {needsYouCount}
                    </span>
                  )}
                </>
              )}
              {collapsed && n.key === "epics" && epicCount > 0 && (
                <span className="absolute right-[5px] top-[5px] font-mono text-[9px] text-[var(--text-3)]">
                  {epicCount}
                </span>
              )}
              {collapsed && n.key === "needsyou" && needsYouCount > 0 && (
                <span
                  className="absolute right-[6px] top-[6px] h-[7px] w-[7px] rounded-full"
                  style={{ background: "var(--brand)" }}
                />
              )}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto flex flex-col gap-[10px]">
        {!collapsed && meta?.gamification && game.data && (
          <div className="rounded-[10px] border border-border bg-[var(--surface)] px-[11px] py-[9px]">
            <div className="flex items-center justify-between text-[11.5px]">
              <span className="font-[650]">Level {game.data.you.level}</span>
              <span className="font-mono text-[var(--text-3)]">{game.data.you.xp} XP</span>
            </div>
            <div className="mt-[6px] h-[6px] overflow-hidden rounded-full bg-[var(--surface-3)]">
              <div
                className="h-full rounded-full transition-[width]"
                style={{
                  width: `${Math.round(game.data.you.progress * 100)}%`,
                  background: "var(--brand)",
                }}
              />
            </div>
            <div className="mt-[4px] text-[10.5px] text-[var(--text-3)]">
              {game.data.you.closed} closed ·{" "}
              {Math.max(0, game.data.you.span - game.data.you.intoLevel)} XP to L
              {game.data.you.level + 1}
            </div>
          </div>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger
            title={collapsed ? "Report / request" : undefined}
            aria-label="Report or request"
            className={cn(
              "flex w-full items-center rounded-[9px] border border-border bg-[var(--surface)] text-[12.5px] font-medium text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)] focus:outline-none",
              collapsed ? "justify-center py-2" : "gap-[10px] px-[10px] py-2 text-left",
            )}
          >
            <Icon name="bug" size={16} className="flex-shrink-0" />
            {!collapsed && (
              <>
                <span className="flex-1">Report / request</span>
                <Icon name="chevron" size={14} className="flex-shrink-0 text-[var(--text-3)]" />
              </>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-[200px]">
            <DropdownMenuLabel>Open a GitHub issue</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => openIssue("bug")}>
              <Icon name="bug" size={14} style={{ color: "#ef4444" }} />
              <span>Report a bug</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openIssue("feature")}>
              <Icon name="feature" size={14} style={{ color: "var(--brand)" }} />
              <span>Request a feature</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className={cn("flex items-center gap-2", collapsed ? "flex-col gap-[10px]" : "px-1")}>
          <div
            className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
            style={{ background: avatarColor(actor) }}
            title={collapsed ? `${actor} · human actor` : undefined}
          >
            {initials(actor)}
          </div>
          {!collapsed && (
            <div className="flex-1 leading-[1.15]">
              <div className="text-[12.5px] font-[550]">{actor}</div>
              <div className="text-[11px] text-[var(--text-3)]">human actor</div>
            </div>
          )}
          <button
            onClick={toggle}
            title="Toggle theme"
            aria-label="Toggle theme"
            className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-lg border border-border bg-[var(--surface)] text-[var(--text-2)] hover:bg-[var(--surface-2)] hover:text-[var(--text)]"
          >
            <Icon name={mode === "dark" ? "sun" : "moon"} size={15} />
          </button>
        </div>

        {!collapsed && <UpdateIndicator />}
        {!collapsed && <BuildBadge />}
      </div>
    </aside>
  );
}
