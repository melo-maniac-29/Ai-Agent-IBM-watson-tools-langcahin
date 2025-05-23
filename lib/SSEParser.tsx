import {
  SSE_DONE_MESSAGE,
  StreamMessageType,
  SSE_DATA_PREFIX,
  StreamMessage,
} from "./types";

/**
 * Creates a parser for Server-Sent Events (SSE) streams.
 * SSE allows real-time updates from server to client.
 */
export const createSSEParser = () => {
  let buffer = "";

  const parse = (chunk: string): StreamMessage[] => {
    // Combine buffer with new chunk and split into lines
    const lines = (buffer + chunk).split("\n");
    // Save last potentially incomplete line
    buffer = lines.pop() || "";

    return lines
      .map((line) => {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith(SSE_DATA_PREFIX)) return null;

        const data = trimmed.substring(SSE_DATA_PREFIX.length);
        if (data === SSE_DONE_MESSAGE) return { type: StreamMessageType.Done };

        try {
          // Handle empty data case
          if (!data.trim()) {
            return {
              type: StreamMessageType.Error,
              error: "Empty SSE data received",
            };
          }

          const parsed = JSON.parse(data) as StreamMessage;

          // Additional validation to ensure parsed data has the required type
          if (!parsed || typeof parsed !== "object") {
            return {
              type: StreamMessageType.Error,
              error: "Malformed SSE message structure",
            };
          }

          return Object.values(StreamMessageType).includes(parsed.type)
            ? parsed
            : {
                type: StreamMessageType.Error,
                error: `Unknown message type: ${parsed.type}`,
                details: parsed,
              };
        } catch (err) {
          return {
            type: StreamMessageType.Error,
            error: `Failed to parse SSE message: ${
              err instanceof Error ? err.message : "Unknown error"
            }`,
            rawData: data,
          };
        }
      })
      .filter((msg): msg is StreamMessage => msg !== null);
  };

  return { parse };
};