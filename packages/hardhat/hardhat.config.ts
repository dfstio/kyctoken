import { HardhatUserConfig, task } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import '@typechain/hardhat'
import 'hardhat-contract-sizer';
import 'hardhat-abi-exporter';
import "hardhat-interface-generator";

import {KEY_OWNER, RELAY, RPC_GOERLI,  RPC_MUMBAI, RPC_L3_HARDHAT,  
		 CHAINID_L3, KEY_ETHERSCAN, KEY_MUMBAI } from '@kyctoken/config';
const  keys  = [KEY_OWNER, RELAY[1], RELAY[2], RELAY[3], RELAY[4], RELAY[5], RELAY[6]];
const defaultNetwork = "l3"; //"hardhat", "mumbai", "l3"

task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});


task("balance", "Prints an account's balance")
  .addPositionalParam("account", "The account's address")
  .setAction(async (taskArgs, { ethers }) => {
    const balance = await ethers.provider.getBalance(taskArgs.account);
    console.log("Balance: ", ethers.utils.formatUnits(balance, "ether"), "ETH");
  });



const config: HardhatUserConfig = {
    defaultNetwork,
    networks: {
    goerli: {
      url: RPC_GOERLI,
      chainId: 5,
      gas:"auto",
      gasPrice: 2e9,
      gasMultiplier:2,
      accounts: keys
    },
    polygon: {
      url: "",
      chainId: 137,
      gas:"auto",
      gasMultiplier:2,
      accounts: keys
    },
    mumbai: {
      url: RPC_MUMBAI,
      chainId: 80001, 
      gas:"auto",
      gasPrice: 60000000000,
      gasMultiplier:2,
      accounts: keys
    },
    l3: {
      url: RPC_L3_HARDHAT,
      chainId: CHAINID_L3, 
      gas:"auto",
      gasPrice: 80000000000,
      gasMultiplier:2,
      accounts: keys
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.15",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      }
    ]
  },
  etherscan: {
      apiKey: { 
      goerli: KEY_ETHERSCAN,
      polygonMumbai: KEY_MUMBAI
    }
  }
};

export default config;
