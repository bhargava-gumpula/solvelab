export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type CoachReply = {
  answer: string;
  refs: { kind: "pack" | "test" | "unit" | "drill" | "lesson" | "set"; id: string }[];
  followUps: string[];
};

export interface OllamaChatOptions {
  model: string;
  numCtx?: number;
  numPredict?: number;
  temperature?: number;
  format?: "json" | object;
  keepAlive?: string;
  signal?: AbortSignal;
  baseUrl?: string;
}
