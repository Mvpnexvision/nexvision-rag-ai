const DEBUG_LOGS =
  (process.env.NEXT_PUBLIC_DEBUG_LOGS ?? "false").toLowerCase() === "true";

export function debugLog(tag: string, message: string): void {
  if (!DEBUG_LOGS) return;
  console.log(`[${tag}] ${message}`);
}
