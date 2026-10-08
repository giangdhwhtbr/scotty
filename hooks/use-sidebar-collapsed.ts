"use client";
import * as React from "react";

const KEY = "bmus.sidebar-collapsed";
const EVENT = "bmus:sidebar-collapsed";
function subscribe(callback: () => void) {
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}
function snapshot(): boolean {
  try { return globalThis.localStorage?.getItem(KEY) === "true"; }
  catch { return false; }
}
export function saveSidebarCollapsed(collapsed: boolean) {
  localStorage.setItem(KEY, String(collapsed));
  window.dispatchEvent(new Event(EVENT));
}

/** A viewing preference for this browser, shared across projects. */
export function useSidebarCollapsed() {
  const collapsed = React.useSyncExternalStore(subscribe, snapshot, () => false);
  return { collapsed, save: saveSidebarCollapsed };
}
