import { z } from "zod";

export const MonitorAddressSchema = z.object({
  userAddress: z.string().describe("Address to monitor"),
  currentLevel: z.number().min(1).max(100).describe("Current user level (1-100)")
});

export const AnalyzeTransactionSchema = z.object({
  txHash: z.string().describe("Transaction hash to analyze"),
  userLevel: z.number().min(1).max(100).describe("User's current level (1-100)"),
  isNewTransaction: z.boolean().describe("Whether this is a new transaction that just occurred")
});

export const UpdateUserProgressSchema = z.object({
  userAddress: z.string(),
  action: z.enum(['TRANSACTION_ANALYZED', 'SAFE_TRANSACTION', 'COMPLEX_INTERACTION', 'FIRST_DEFI', 'ACHIEVEMENT_UNLOCKED']),
  context: z.object({
    transactionHash: z.string().optional(),
    achievementId: z.string().optional(),
    complexity: z.number().optional(),
  }).optional(),
});

export const StopMonitoringSchema = z.object({
  userAddress: z.string().describe("Address to stop monitoring")
});