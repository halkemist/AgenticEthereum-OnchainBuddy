"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const zod_1 = require("zod");
const index_1 = require("./index");
const agentkit_1 = require("@coinbase/agentkit");
// Mocking the Action class
const mockAction = {
    name: "testAction",
    description: "A test action",
    schema: zod_1.z.object({ test: zod_1.z.string() }),
    invoke: jest.fn(async (arg) => `Invoked with ${arg.test}`),
};
// Creating a mock for AgentKit
jest.mock("@coinbase/agentkit", () => {
    const originalModule = jest.requireActual("@coinbase/agentkit");
    return {
        ...originalModule,
        AgentKit: {
            from: jest.fn().mockImplementation(() => ({
                getActions: jest.fn(() => [mockAction]),
            })),
        },
    };
});
describe("getLangChainTools", () => {
    it("should return an array of tools with correct properties", async () => {
        const mockAgentKit = await agentkit_1.AgentKit.from({});
        const tools = await (0, index_1.getLangChainTools)(mockAgentKit);
        expect(tools).toHaveLength(1);
        const tool = tools[0];
        expect(tool.name).toBe(mockAction.name);
        expect(tool.description).toBe(mockAction.description);
        expect(tool.schema).toBe(mockAction.schema);
        const result = await tool.invoke({ test: "data" });
        expect(result).toBe("Invoked with data");
    });
});
