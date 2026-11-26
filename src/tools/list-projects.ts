import { aiClient } from "../lib/ai-client";

export default async function tool() {
  return aiClient().projects();
}
