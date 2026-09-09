"use client";

import * as React from "react";
import { createPortal } from "react-dom";

export const HEADER_ACTIONS_ID = "console-header-actions";

function subscribe() {
  return () => {};
}

/** Renders its children into the console header's action slot. */
export function HeaderActions({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const target = React.useSyncExternalStore(
    subscribe,
    () => document.getElementById(HEADER_ACTIONS_ID),
    () => null,
  );
  if (!target) return null;
  return createPortal(children, target);
}
