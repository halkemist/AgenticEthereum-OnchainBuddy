"use strict";
/**
 * Main exports for the CDP Langchain package
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLangChainTools = getLangChainTools;
const tools_1 = require("@langchain/core/tools");
/**
 * Get Langchain tools from an AgentKit instance
 *
 * @param agentKit - The AgentKit instance
 * @returns An array of Langchain tools
 */
async function getLangChainTools(agentKit) {
    const actions = agentKit.getActions();
    return actions.map(action => (0, tools_1.tool)(async (arg) => {
        const result = await action.invoke(arg);
        return result;
    }, {
        name: action.name,
        description: action.description,
        schema: action.schema,
    }));
}
