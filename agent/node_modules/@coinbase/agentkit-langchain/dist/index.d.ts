/**
 * Main exports for the CDP Langchain package
 */
import { StructuredTool } from "@langchain/core/tools";
import { AgentKit } from "@coinbase/agentkit";
/**
 * Get Langchain tools from an AgentKit instance
 *
 * @param agentKit - The AgentKit instance
 * @returns An array of Langchain tools
 */
export declare function getLangChainTools(agentKit: AgentKit): Promise<StructuredTool[]>;
