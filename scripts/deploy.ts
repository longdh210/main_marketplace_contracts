import { ethers, upgrades } from "hardhat";
import fs from "fs";
import { Contract } from "ethers";
import {
  WyvernExchange,
  WyvernExchange__factory,
  WyvernTokenTransferProxy,
  WyvernTokenTransferProxy__factory,
  MockERC721,
  MockERC721__factory,
  WyvernProxyRegistry__factory,
  WyvernProxyRegistry,
  MockERC20,
  MockERC20__factory,
} from '../typechain-types';
import { key } from "../key";

async function main() {
  // const [owner, addr1, addr2] = await ethers.getSigners();
  let wyvernExchange: WyvernExchange;
  let wyvernProxyRegistry: WyvernProxyRegistry;
  let wyvernTokenTransferProxy: WyvernTokenTransferProxy;
  let mockERC721: MockERC721;
  let mockToken
  let wyvernAtomicizer: Contract;

  const EstNFTFactory: MockERC721__factory = await ethers.getContractFactory("MockERC721");;
  mockERC721 = await EstNFTFactory.deploy();
  await mockERC721.deployed();

  await mockERC721.mint(key.account1.publicKey, "1");

  const MockTokenFactory = await ethers.getContractFactory("MockERC20");;
  mockToken = await MockTokenFactory.deploy("MockERC20", "M20", 100000);
  await mockToken.deployed();

  await mockToken.mint(key.account2.publicKey, 10000);

  const WyvernAtomicizerFactory = await ethers.getContractFactory("WyvernAtomicizer");
  wyvernAtomicizer = await WyvernAtomicizerFactory.deploy();
  await wyvernAtomicizer.deployed();

  const WyvernProxyRegistryFactory: WyvernProxyRegistry__factory = await ethers.getContractFactory("WyvernProxyRegistry");
  wyvernProxyRegistry = (await upgrades.deployProxy(WyvernProxyRegistryFactory, [1], {
    initializer: '__WyvernProxyRegistry_init',
  })) as WyvernProxyRegistry;
  await wyvernProxyRegistry.deployed();

  // Call wyvern proxy registry
  // await wyvernProxyRegistry.__WyvernProxyRegistry_init(10);

  const WyvernTokenTransferProxy: WyvernTokenTransferProxy__factory = await ethers.getContractFactory("WyvernTokenTransferProxy");
  wyvernTokenTransferProxy = await WyvernTokenTransferProxy.deploy(wyvernProxyRegistry.address);
  await wyvernTokenTransferProxy.deployed();

  const WyvernExchangeFactory = await ethers.getContractFactory("WyvernExchange");
  wyvernExchange = (await upgrades.deployProxy(
    WyvernExchangeFactory,
    [wyvernProxyRegistry.address, wyvernTokenTransferProxy.address, mockToken.address, key.owner.publicKey],
    { initializer: '__WyvernExchange_init' },
  )) as WyvernExchange;
  await wyvernExchange.deployed();

  await wyvernProxyRegistry.grantInitialAuthentication(wyvernExchange.address);

  console.log(`Atomicizer deployed to ${wyvernAtomicizer.address}`);
  console.log(`Proxy registry deployed to ${wyvernProxyRegistry.address}`);
  console.log(`Token transfer proxy deployed to ${wyvernTokenTransferProxy.address}`);
  console.log(`Exchange deployed to ${wyvernExchange.address}`);
  console.log(`Mock ERC20 deployed to ${mockToken.address}`);
  console.log(`Mock ERC721 deployed to ${mockERC721.address}`);

  fs.writeFileSync(
    "./config.js",
    `const atomicizerContractAddress = "${wyvernAtomicizer.address}";
    const proxyRegistryContractAddress = "${wyvernProxyRegistry.address}";
    const tokenTransferProxyContractAddress = "${wyvernTokenTransferProxy.address}";
    const exchangeContractAddress = "${wyvernExchange.address}";
    const mockERC20ContractAddress = "${mockToken.address}";
    const mockERC721ContractAddress = "${mockERC721.address}";
    module.exports = {atomicizerContractAddress, proxyRegistryContractAddress, tokenTransferProxyContractAddress, exchangeContractAddress, mockERC20ContractAddress, mockERC721ContractAddress}`
  )
  fs.writeFileSync(
    "./address.ts",
    `export const CHAIN_ADDRESSES = {
      "localhost": {
        AtomicizerContractAddress: "${wyvernAtomicizer.address}",
        ProxyRegistryContractAddress: "${wyvernProxyRegistry.address}",
        TokenTransferProxyContractAddress: "${wyvernTokenTransferProxy.address}",
        ExchangeContractAddress: "${wyvernExchange.address}",
        MockERC20ContractAddress: "${mockToken.address}",
        MockERC721ContractAddress: "${mockERC721.address}",
      }
}`)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
})