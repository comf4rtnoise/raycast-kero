import { Tool } from "@raycast/api";
import { aiClient } from "../lib/ai-client";
import { readPane, resolvePane, READ_LINES, READ_CHARACTERS } from "../lib/ai";

type Input = {
  /** Exact terminal pane ID from list-sessions, explicitly selected by the user. */
  paneId: string;
};

export const confirmation: Tool.Confirmation<Input> = async (input) => {
  const { session, pane } = await resolvePane(aiClient(), input.paneId);
  if (pane.url) throw new Error("Browser panes are not supported.");
  return {
    message:
      "Share this terminal screen with Raycast AI? It may contain private code or secrets. Filtering cannot guarantee removal of sensitive data.",
    info: [
      {
        name: "Privacy",
        value: "Shared with Raycast AI. May contain private code or secrets; filtering is not guaranteed.",
      },
      { name: "Session", value: session.name || session.title || session.id },
      { name: "Pane ID", value: pane.id },
      { name: "Limit", value: `Up to ${READ_LINES} screen lines / ${READ_CHARACTERS} characters; no scrollback` },
    ],
  };
};

export default async function tool(input: Input) {
  return readPane(aiClient(), input.paneId);
}
