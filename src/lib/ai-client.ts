import { getPreferenceValues } from "@raycast/api";
import { KeroClient } from "./kero";

export function aiClient() {
  return new KeroClient(getPreferenceValues<{ keroPath?: string }>().keroPath);
}
