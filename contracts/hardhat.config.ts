import hardhatToolboxMochaEthersPlugin from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import "@nomicfoundation/hardhat-ethers";
import { configVariable, defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [hardhatToolboxMochaEthersPlugin],
  
  solidity: {

    profiles: {
      default: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
      production: {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    },
  },
  networks: {
    hardhatMainnet: {
      type: "edr-simulated",
      chainType: "l1",
    },
    hardhatOp: {
      type: "edr-simulated",
      chainType: "op",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      url: configVariable("PRIVATE"),
      accounts: [configVariable("PRIVATE")],
    },
     mantle: {
      type: "http",
            url: "https://rpc.mantle.xyz", //mainnet
           accounts: [configVariable("PRIVATE_KEY_MANTLE")],
        },
        mantleSepolia: {
          type: "http",
          chainType: "l1",
          url: "https://mantle-sepolia.drpc.org", // Sepolia Testnet
 // Official Sepolia RPC
          accounts: [configVariable("game")],
          timeout: 120000,
          
        },
  },
  verify: {
    etherscan: {
      apiKey: "3IQTM6FU96R1JRBMBEBD3I67SUFP2YV3I1"
    }
  }
});
