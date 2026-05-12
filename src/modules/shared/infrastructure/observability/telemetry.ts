export type TelemetryOutcome = "success" | "error" | "rejected";

export interface TelemetryEvent {
  scope: string;
  action: string;
  outcome: TelemetryOutcome;
  proposalId?: string;
  version?: number;
  statusCode?: number;
  durationMs?: number;
  detail?: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
}

export const telemetryNow = (): number => Date.now();

export const telemetryDuration = (startMs: number): number => Math.max(Date.now() - startMs, 0);

export const trackTelemetry = (event: TelemetryEvent): void => {
  const payload = {
    timestamp: new Date().toISOString(),
    ...event,
  };

  if (event.outcome === "error") {
    console.error("[telemetry]", JSON.stringify(payload));
    return;
  }

  console.log("[telemetry]", JSON.stringify(payload));
};
