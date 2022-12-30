// import { cloneDeep } from 'lodash';
// import { DeployFunction } from 'hardhat-deploy/dist/types';
// import { HardhatRuntimeEnvironment } from 'hardhat/types';
// import { ContractName, deployProxy, readAddressesConfig, writeAddressesConfig } from './utils';
// import { DELAY_PERIOD } from '../env';

// const func: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
//   const { network = 'hardhat' } = hre.hardhatArguments;

//   const originalAddresses = readAddressesConfig(network);
//   const addresses = cloneDeep(originalAddresses);

//   const contract: ContractName = 'WyvernProxyRegistry';

//   const { addresses: wyvernProxyRegistryAddresses } = await deployProxy(
//     hre,
//     addresses[contract],
//     contract,
//     '__WyvernProxyRegistry_init',
//     [DELAY_PERIOD],
//   );
//   addresses[contract] = wyvernProxyRegistryAddresses;
//   if (network !== 'hardhat') {
//     writeAddressesConfig(network, addresses);
//   }
// };

// module.exports = func;
