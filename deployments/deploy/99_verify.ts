// import { cloneDeep } from 'lodash';
// import { HardhatRuntimeEnvironment } from 'hardhat/types';
// import { DeployFunction } from 'hardhat-deploy/types';
// import 'hardhat-deploy';
// import '@openzeppelin/hardhat-upgrades';

// import { ContractName, readAddressesConfig, verifyContract, writeAddressesConfig } from './utils';

// const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
//   const { network = 'hardhat' } = hre.hardhatArguments;
//   if (network === 'hardhat') {
//     return;
//   }

//   const originalAddresses = readAddressesConfig(network);
//   const addresses = cloneDeep(originalAddresses);

//   let contract: ContractName;
//   // eslint-disable-next-line
//   contract = 'WyvernProxyRegistry';
//   if (addresses[contract]?.verified !== true) {
//     addresses[contract].verified = await verifyContract(
//       hre,
//       `contracts/${contract}.sol:${contract}`,
//       addresses[contract].address,
//     );
//   }
//   ///////////

//   writeAddressesConfig(network, addresses);
// };

// module.exports = func;

// func.tags = ['verify'];
