import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
require("hardhat-contract-sizer");
require("dotenv").config();

if (!process.env.RPC_KEY) {
  throw new Error("Please set a RPC KEY in .env file");
}
if (!process.env.PRIVATE_KEY) {
  throw new Error("Please set a PRIVATE KEY in .env file");
}
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const RPC_KEY = process.env.RPC_KEY;

const config: HardhatUserConfig = {
  solidity: "0.8.28",

  defaultNetwork: "hardhat",

  networks: {
    hardhat: {
      allowUnlimitedContractSize: true,
      forking: {
        url: `https://base-sepolia.g.alchemy.com/v2/${RPC_KEY}`,
        blockNumber: 21368498, // 02/02/2025
      },
      accounts: {
        accountsBalance: "10000000000000000000000" // 10000 ETH
      }
    },
    base_sepolia: {
      url: `https://base-sepolia.g.alchemy.com/v2/${RPC_KEY}`,
      chainId: 84532,
      accounts: [PRIVATE_KEY],
      gasPrice: "auto",
      gas: 5000000,
      timeout: 60000,
      allowUnlimitedContractSize: true,
    },
    base_mainnet: {
      url: `https://base-mainnet.g.alchemy.com/v2/${RPC_KEY}`,
      chainId: 8453,
      accounts: [PRIVATE_KEY],
    }
  },

  etherscan: {
    apiKey: "any",
    customChains: [
      {
        network: "base_sepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org/"
        }
      },
      {
        network: "base_mainnet",
        chainId: 8453,
        urls: {
          apiURL: "https://api.basescan.org/api",
          browserURL: "https://basescan.org/"
        }
      }
    ]
  }
};

export default config;
