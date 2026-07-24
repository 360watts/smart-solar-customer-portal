export type AssistantRole = "user" | "assistant";

export interface AssistantMessage {
  id: string;
  role: AssistantRole;
  content: string;
  ts: number;
  isError?: boolean;
  /** Set when the stream ended before a natural completion (network drop, etc). */
  cutOff?: boolean;
}
