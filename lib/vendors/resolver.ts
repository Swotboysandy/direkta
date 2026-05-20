import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { vendors } from "../db/repo";
import type { LanguageModel } from "ai";
import type { VendorConfig } from "../types";

export function resolveModel(vendor: VendorConfig): LanguageModel {
  switch (vendor.provider) {
    case "anthropic": {
      const client = createAnthropic({ apiKey: vendor.api_key });
      return client(vendor.model);
    }
    case "openai":
    case "openai-compatible":
    case "deepseek": {
      const client = createOpenAI({
        apiKey: vendor.api_key,
        baseURL: vendor.base_url || undefined
      });
      return client(vendor.model);
    }
    case "google": {
      const client = createGoogleGenerativeAI({ apiKey: vendor.api_key });
      return client(vendor.model);
    }
    default:
      throw new Error(`Unsupported provider: ${vendor.provider}`);
  }
}

export class VendorUnavailableError extends Error {
  constructor() {
    super("No vendor is enabled and configured with an API key. Open /settings to add one.");
    this.name = "VendorUnavailableError";
  }
}

export function activeModel(): LanguageModel {
  const vendor = vendors.firstEnabled();
  if (!vendor) throw new VendorUnavailableError();
  return resolveModel(vendor);
}

export function activeVendor(): VendorConfig {
  const vendor = vendors.firstEnabled();
  if (!vendor) throw new VendorUnavailableError();
  return vendor;
}
