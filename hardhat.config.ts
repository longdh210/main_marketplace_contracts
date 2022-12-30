import { HardhatUserConfig } from 'hardhat/types';

import '@typechain/hardhat';
import '@nomiclabs/hardhat-ethers';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-etherscan';
import '@openzeppelin/hardhat-upgrades';
import '@nomiclabs/hardhat-web3';
import 'hardhat-deploy';
import './scripts/WyvernExchange/deploy.ts';
import './scripts/WyvernProxyRegistry/deploy.ts';
import './scripts/WyvernTokenTransferProxy/deploy.ts';
import './scripts/WyvernAtomicizer/deploy.ts';

import { INFURA_API_KEY, PRIVATE_KEY, ETHERSCAN_API_KEY } from './env';
import { key } from './key';

const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  solidity: {
    compilers: [
      {
        version: '0.8.11',
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
        },
      },
    ],
  },
  networks: {
    hardhat: {},
    mainnet: {
      url: `https://mainnet.infura.io/v3/${INFURA_API_KEY}`,
      chainId: 1,
      accounts: [`0x${PRIVATE_KEY}`],
    },
    goerli: {
      chainId: 5,
      url: "https://eth-goerli.g.alchemy.com/v2/BAexJjh839qZdzF1_CxPlqcd3WRQexU9",
      accounts: [key.owner.privateKey],
    },
    coverage: {
      url: 'http://localhost:8555',
    },
    localhost: {
      url: `http://127.0.0.1:8545`,
    },
  },
  namedAccounts: {
    deployer: 0,
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: ETHERSCAN_API_KEY,
  },
};

export default config;
