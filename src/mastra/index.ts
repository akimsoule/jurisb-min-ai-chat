import { Mastra } from "@mastra/core";
import { legalAgent } from "./agents/legal-agent";

// Configuration Mastra
export const mastra = new Mastra({
  agents: {
    "legal-agent": legalAgent,
  },
});

export { neogma } from "./database/neo4j";
export { legalAgent } from "./agents/legal-agent";
