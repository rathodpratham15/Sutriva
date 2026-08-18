import { getVisionModel, getVisionProviderName } from "@tracelens/core";
import { MockVisionProvider } from "./mock.js";
import { AnthropicVisionProvider } from "./anthropic.js";
import type { VisionProvider } from "./types.js";

export function createVisionProvider(): VisionProvider {
  const name = getVisionProviderName();
  switch (name) {
    case "anthropic":
      return new AnthropicVisionProvider({ model: getVisionModel() });
    case "mock":
      return new MockVisionProvider();
    default:
      throw new Error(`Unknown TRACELENS_VISION_PROVIDER "${name}". Expected "anthropic" or "mock".`);
  }
}
