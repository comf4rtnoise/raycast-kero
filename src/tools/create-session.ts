import { Tool } from "@raycast/api";
import { aiClient } from "../lib/ai-client";
import { createSession, prepareCreation } from "../lib/ai";

type Input = {
  /** Explicit existing absolute directory, or ~/ path. Use a directory chosen by the user or a selected project's directory; never guess. */
  directory: string;
  /** Exact existing project ID from list-projects. Omit to let Kero associate the directory. */
  projectId?: string;
  /** Optional single-line session name. */
  name?: string;
};

export const confirmation: Tool.Confirmation<Input> = async (input) => {
  const prepared = await prepareCreation(aiClient(), input);
  return {
    message:
      "Create a local Kero shell session? This starts your configured shell but does not send a command or focus the session.",
    info: [
      { name: "Directory", value: prepared.directory },
      { name: "Project ID", value: prepared.projectId || "Automatic, based on directory" },
      { name: "Name", value: prepared.name || "Automatic" },
    ],
  };
};

export default async function tool(input: Input) {
  return createSession(aiClient(), input);
}
