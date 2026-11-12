import { isTodo } from "@/content/work";

/**
 * Drop unwritten fields. The room shows todo() markers as a visible
 * "not written yet" state; the public brief never shows a placeholder.
 */
export const real = (xs: string[]) => xs.filter((s) => !isTodo(s));

/** a single field: its text, or null when it is still a todo() marker */
export const realOne = (s: string) => (isTodo(s) ? null : s);
