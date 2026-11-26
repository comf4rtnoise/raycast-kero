import { aiClient } from "../lib/ai-client";
import { focusPane } from "../lib/ai";

type Input = {
  /** Exact pane ID from list-sessions. Never use a session ID, prefix, or name. */
  paneId: string;
};

export default async function tool(input: Input) {
  return focusPane(aiClient(), input.paneId);
}
