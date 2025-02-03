# AgenticEthereum-OnchainBuddy

Onchain Buddy is an AI assistant that helps beginners understand their blockchain activities. It analyzes transactions, explains them in simple terms, and guides users to learn about blockchain in a safe and proper way.

As your personal blockchain companion he acts as a real-time translator between complex blockchain operations and everyday language.

To making your first token swap or approving a new smart contract, it break down each action in clear and understandable explanations.

## Stack

- Solidity
- Next
- Wagmi, Viem, Ethers
- TailwindCSS
- MUI
- OnchainKit by Coinbase (wallet integration)
- AgentKit

## AI Agent features

- Provide explanations of user transactions
- Provide explanations of user approvals
- Alert the user if a transaction looks risky
- Daily suggestion based on yser activity
- Update your level if you deserve it

NB: Explanation depends on your current level

## User Interface

### Pages

- Dashboard
- Transaction Explorer
- Learning Center
- Settings

## Flow

User Wallet --> OnchainKit --> Frontend --> Query Last User Transactions --> AgentKit --> Frontend

## Blockchain

I chose Base because of low fees transaction cost and fast confirmations.