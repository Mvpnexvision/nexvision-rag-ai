"use client";

import { useCallback } from "react";
import { useChatWorkflowApi } from "@/hooks/useChatWorkflowApi";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const POLL_INTERVAL_MS = 500;

// ---------------------------------------------------------------------------
// Status helpers
// ---------------------------------------------------------------------------

export type PollStatus = "processing" | "completed" | "failed";

export function mapPollStatus(rawStatus: string): PollStatus {
  const normalized = rawStatus.toLowerCase();
  if (normalized === "ai ready") return "completed";
  if (normalized === "failed") return "failed";
  return "processing";
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DocumentPollResult {
  documentId: string;
  fileName: string;
  finalStatus: PollStatus;
}

export interface PollOptions {
  /**
   * Called on every successful status poll so the caller can update UI.
   * Receives the raw `processing_status` string directly from the backend.
   */
  onStatusUpdate: (rawStatus: string) => void;
  /**
   * Optional external AbortSignal. When aborted, polling stops immediately
   * (e.g. when the parent component unmounts or the user navigates away).
   */
  signal?: AbortSignal;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * `useDocumentPolling` exposes a single `processAndPoll` function that:
 *   1. Triggers the backend processing pipeline for a document.
 *   2. Polls `/documents/{id}/status` every `POLL_INTERVAL_MS` ms.
 *   3. Calls `onStatusUpdate` on each tick so the caller can reflect the
 *      real-time status in the UI.
 *   4. Resolves when processing is complete, or throws on failure / abort.
 *
 * The hook is intentionally stateless — callers own the AbortController so
 * multiple parallel polls can be cancelled with a single signal (e.g. on
 * component unmount).
 */
export function useDocumentPolling() {
  const { processDocument, getDocumentStatus } = useChatWorkflowApi();

  const processAndPoll = useCallback(
    async (
      documentId: string,
      { onStatusUpdate, signal }: PollOptions,
    ): Promise<DocumentPollResult> => {
      // ── 1. Kick off the processing pipeline ──────────────────────────────
      if (signal?.aborted) {
        throw new DOMException(
          "Polling was cancelled before it started.",
          "AbortError",
        );
      }

      await processDocument(documentId);

      // ── 2. Poll until terminal state ─────────────────────────────────────
      for (;;) {
        if (signal?.aborted) {
          throw new DOMException("Polling was cancelled.", "AbortError");
        }

        const statusResponse = await getDocumentStatus(documentId);
        const pollStatus = mapPollStatus(statusResponse.processing_status);

        // Notify the caller so it can update the system message / UI.
        onStatusUpdate(statusResponse.processing_status);

        if (pollStatus === "completed") {
          return {
            documentId,
            fileName: statusResponse.file_name,
            finalStatus: "completed",
          };
        }

        if (pollStatus === "failed") {
          throw new Error(
            `Document "${statusResponse.file_name}" failed during processing.`,
          );
        }

        // ── 3. Wait for next poll tick, honouring abort ───────────────────
        await new Promise<void>((resolve, reject) => {
          const timer = setTimeout(resolve, POLL_INTERVAL_MS);

          signal?.addEventListener(
            "abort",
            () => {
              clearTimeout(timer);
              reject(new DOMException("Polling cancelled.", "AbortError"));
            },
            { once: true },
          );
        });
      }
    },
    [processDocument, getDocumentStatus],
  );

  return { processAndPoll };
}
