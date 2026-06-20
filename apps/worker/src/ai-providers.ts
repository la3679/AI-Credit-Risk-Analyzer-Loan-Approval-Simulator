import { env } from "../../api/src/config";
import { SIMULATOR_DISCLAIMER } from "@credora/shared";

export interface AIProvider {
  readonly name: string;
  generateUnderwritingMemo(input: unknown, options?: { promptTemplate?: string }): Promise<string>;
}

function systemPrompt(promptTemplate?: string) {
  return `Write a concise, plain-text educational credit-simulation memo. Never state or imply a real lending decision, regulatory compliance, financial advice, or real-credit-report access. Do not make claims beyond the deterministic simulation input. Include this disclaimer verbatim: ${SIMULATOR_DISCLAIMER}${promptTemplate ? `\n\nUse this approved template as additional writing guidance:\n${promptTemplate}` : ""}`;
}

class MockProvider implements AIProvider {
  readonly name = "mock";
  async generateUnderwritingMemo(input: any) {
    return `Educational simulation summary: the profile is ${String(input.result.simulatedDecision).replaceAll("_", " ")} with a ${Math.round(input.result.approvalProbability * 100)}% simulated approval signal. Projected debt-to-income after the loan is ${(input.derived.dtiAfterLoan * 100).toFixed(1)}%. ${SIMULATOR_DISCLAIMER}`;
  }
}
export function getMockProvider(): AIProvider { return new MockProvider(); }

class OpenAICompatibleProvider implements AIProvider {
  constructor(public readonly name: string, private baseUrl: string, private apiKey: string, private model: string) {}
  async generateUnderwritingMemo(input: unknown, options?: { promptTemplate?: string }) {
    const response = await fetch(`${this.baseUrl.replace(/\/$/, "")}/chat/completions`, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${this.apiKey}` }, body: JSON.stringify({ model: this.model, temperature: 0.2, messages: [{ role: "system", content: systemPrompt(options?.promptTemplate) }, { role: "user", content: JSON.stringify(input) }] }) });
    if (!response.ok) throw new Error(`${this.name} request failed with ${response.status}`);
    const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
    const output = data.choices?.[0]?.message?.content;
    if (!output) throw new Error(`${this.name} returned no narrative`);
    return output;
  }
}

class AnthropicProvider implements AIProvider {
  readonly name = "anthropic";
  async generateUnderwritingMemo(input: unknown, options?: { promptTemplate?: string }) {
    if (!env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is required");
    const response = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "content-type": "application/json", "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" }, body: JSON.stringify({ model: env.ANTHROPIC_MODEL, max_tokens: 500, system: systemPrompt(options?.promptTemplate), messages: [{ role: "user", content: JSON.stringify(input) }] }) });
    if (!response.ok) throw new Error(`anthropic request failed with ${response.status}`);
    const data = await response.json() as { content?: Array<{ text?: string }> };
    if (!data.content?.[0]?.text) throw new Error("anthropic returned no narrative");
    return data.content[0].text;
  }
}

class GeminiProvider implements AIProvider {
  readonly name = "gemini";
  async generateUnderwritingMemo(input: unknown, options?: { promptTemplate?: string }) {
    if (!env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is required");
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent?key=${env.GEMINI_API_KEY}`;
    const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ contents: [{ parts: [{ text: `${systemPrompt(options?.promptTemplate)}\n\n${JSON.stringify(input)}` }] }] }) });
    if (!response.ok) throw new Error(`gemini request failed with ${response.status}`);
    const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    const output = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!output) throw new Error("gemini returned no narrative");
    return output;
  }
}

export function getAIProvider(): AIProvider {
  switch (env.AI_PROVIDER) {
    case "openai":
      if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required");
      return new OpenAICompatibleProvider("openai", "https://api.openai.com/v1", env.OPENAI_API_KEY, env.OPENAI_MODEL);
    case "openrouter":
      if (!env.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY is required");
      return new OpenAICompatibleProvider("openrouter", "https://openrouter.ai/api/v1", env.OPENROUTER_API_KEY, env.OPENROUTER_MODEL);
    case "groq":
      if (!env.GROQ_API_KEY) throw new Error("GROQ_API_KEY is required");
      return new OpenAICompatibleProvider("groq", "https://api.groq.com/openai/v1", env.GROQ_API_KEY, env.GROQ_MODEL);
    case "together":
      if (!env.TOGETHER_API_KEY) throw new Error("TOGETHER_API_KEY is required");
      return new OpenAICompatibleProvider("together", "https://api.together.xyz/v1", env.TOGETHER_API_KEY, env.TOGETHER_MODEL);
    case "ollama": return new OpenAICompatibleProvider("ollama", `${env.OLLAMA_BASE_URL}/v1`, "ollama", env.OLLAMA_MODEL);
    case "anthropic": return new AnthropicProvider();
    case "gemini": return new GeminiProvider();
    default: return getMockProvider();
  }
}
