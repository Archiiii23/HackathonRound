import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { presenceQuery, qk } from "./queries";

/**
 * usePresence(projectId)
 *
 * Sends a heartbeat to the backend every 12s while the tab is mounted,
 * and polls the presence roster every 10s (via React Query refetchInterval).
 * Backend keeps an in-memory roster keyed by project; entries older than 30s
 * are swept on the next read. This is a lightweight "good enough" presence
 * model for the demo — it would be replaced by a Durable Object WebSocket
 * for a multi-isolate production deployment.
 */
export function usePresence(projectId: string | null | undefined) {
  const enabled = !!projectId;
  const query = useQuery({
    ...presenceQuery(projectId ?? ""),
    enabled,
  });
  const queryClient = useQueryClient();

  React.useEffect(() => {
    if (!enabled || !projectId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      if (cancelled) return;
      api.presenceHeartbeat(projectId).catch(() => {
        /* network errors are non-fatal for presence */
      });
    };

    tick();
    timer = setInterval(() => {
      tick();
      // also nudge the roster to refresh after every heartbeat
      queryClient.invalidateQueries({ queryKey: qk.presence(projectId) });
    }, 12_000);

    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [projectId, enabled, queryClient]);

  return query;
}
