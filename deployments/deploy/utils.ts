// import { Contract } from 'ethers';
// import fs from 'fs';
// import { HardhatRuntimeEnvironment } from 'hardhat/types';
// import { getImplementationAddress } from '@openzeppelin/upgrades-core';
// import path from 'path';
// import { upgrades } from 'hardhat';

// export type ContractName = 'WyvernExchange' | 'WyvernTokenTransferProxy' | 'WyvernProxyRegistry';

// export type ContractAddresses = {
//   address: string;
//   verified: boolean;
//   proxy?: string;
// };

// export type ContractAddressesData = Record<ContractName, ContractAddresses>;

// export const readAddressesConfig = (network: string): ContractAddressesData => {
//   const configPath = path.resolve(__dirname, '../deployments', network, 'addresses.json');

//   if (fs.existsSync(configPath)) {
//     return JSON.parse(fs.readFileSync(configPath).toString());
//   }

//   return {} as any;
// };

// export const writeAddressesConfig = (network: string, config: any) => {
//   const configPath = path.resolve(__dirname, '../deployments', network, 'addresses.json');

//   fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
// };

// export const deployContract = async (
//   hre: HardhatRuntimeEnvironment,
//   addresses: ContractAddresses,
//   contract: ContractName,
//   ...args: any[]
// ) => {
//   const { deployments, getNamedAccounts } = hre;
//   const { deploy } = deployments;
//   const { deployer } = await getNamedAccounts();

//   const instance = await deploy(contract, { from: deployer, log: false, args });

//   if (instance.newlyDeployed) {
//     console.log(`${contract} deployed at`, instance.address);
//   } else {
//     console.log(`${contract} reused at`, instance.address);
//   }

//   return {
//     address: instance.address,
//     verified: addresses?.verified && addresses?.address === instance.address,
//   };
// };

// export const deployProxy = async (
//   hre: HardhatRuntimeEnvironment,
//   addresses: ContractAddresses,
//   contract: ContractName,
//   initializer?: string,
//   ...args: any[]
// ): Promise<{ instance: string; proxyInstance: Contract; addresses: ContractAddresses }> => {
//   const { network = 'hardhat' } = hre.hardhatArguments;
//   const useProxy = network !== 'hardhat';

//   const { ethers, deployments, getNamedAccounts } = hre;
//   const { deploy } = deployments;
//   // const { deployProxy: _deployProxy, upgradeProxy } = upgrades;
//   const { deployer } = await getNamedAccounts();

//   const _factory = await ethers.getContractFactory(contract);

//   let proxyInstance: Contract;
//   let implInstance: string;
//   if (useProxy) {
//     const proxy = addresses?.proxy;
//     if (!proxy) {
//       proxyInstance = await upgrades.deployProxy(_factory, ...args, {
//         initializer: initializer ? initializer : 'initialize',
//       });
//       console.log(`${contract} Proxy deployed at`, proxyInstance.address);
//     } else {
//       proxyInstance = await upgrades.upgradeProxy(proxy, _factory);
//       console.log(`${contract} Proxy reused at`, proxyInstance.address);
//     }
//     await proxyInstance.deployed();

//     implInstance = await getImplementationAddress(ethers.provider, proxyInstance.address);
//   } else {
//     await deploy(contract, { from: deployer, log: false, args });
//     proxyInstance = await ethers.getContract(contract);

//     implInstance = proxyInstance.address;
//   }
//   const factoryImplChanged = addresses?.address !== implInstance;
//   if (factoryImplChanged) {
//     console.log(`${contract} deployed at`, implInstance);
//   } else {
//     console.log(`${contract} reused at`, implInstance);
//   }
//   return {
//     instance: implInstance,
//     proxyInstance,
//     addresses: {
//       address: implInstance,
//       proxy: proxyInstance.address,
//       verified: !!addresses?.verified && !factoryImplChanged,
//     },
//   };
// };

// export const verifyContract = async (
//   hre: HardhatRuntimeEnvironment,
//   contract: string,
//   address: string,
//   ...args: any[]
// ) => {
//   return hre.run('verify:verify', { address, contract, constructorArguments: args }).then(
//     () => true,
//     (err) => {
//       if (err.message !== 'Contract source code already verified') {
//         console.log(`${contract} is failed to verify`, err.message);
//         return false;
//       }

//       console.log(`${contract} already verified`);
//       return false;
//     },
//   );
// };

// export default () => {
//   // do nothing
// };
