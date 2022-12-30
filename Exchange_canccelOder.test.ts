import { expect } from 'chai';
import { describe } from 'mocha';
import { ethers, upgrades, web3 } from 'hardhat';
import {
  WyvernExchange,
  WyvernExchange__factory,
  WyvernTokenTransferProxy,
  WyvernTokenTransferProxy__factory,
  MockERC721,
  MockERC721__factory,
  WyvernProxyRegistry__factory,
  WyvernProxyRegistry,
} from '../typechain-types';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signers';
import { BigNumber, constants } from 'ethers';
import { hashOrder, makeOrder } from './utils';

const replacementPatternBuy =
  '0x00000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000';

const replacementPatternSell =
  '0x000000000000000000000000000000000000000000000000000000000000000000000000ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0000000000000000000000000000000000000000000000000000000000000000';

describe('Exchange Test Suite', () => {
  let WyvernExchange: WyvernExchange;
  let ProxyRegistry: WyvernProxyRegistry;
  let TokenTransferProxy: WyvernTokenTransferProxy;
  let [owner, account1, account2]: SignerWithAddress[] = [];
  let EstNFT: MockERC721;
  before(async () => {
    [owner, account1, account2] = await ethers.getSigners();
  });
  beforeEach(async () => {
    // Deploy Est NFT
    const EstNFTFactory: MockERC721__factory = await ethers.getContractFactory('MockERC721');
    EstNFT = await EstNFTFactory.deploy();
    await EstNFT.mint(owner.address, '1');

    // Deploy Proxy Registry
    const ProxyRegistryFactory: WyvernProxyRegistry__factory = await ethers.getContractFactory('WyvernProxyRegistry');
    ProxyRegistry = (await upgrades.deployProxy(ProxyRegistryFactory, [1], {
      initializer: '__WyvernProxyRegistry_init',
    })) as WyvernProxyRegistry;
    // Deploy Token Transfer Proxy
    const TokenTransferProxyFactory: WyvernTokenTransferProxy__factory = await ethers.getContractFactory(
      'WyvernTokenTransferProxy',
    );
    TokenTransferProxy = await TokenTransferProxyFactory.deploy(ProxyRegistry.address);

    // Deploy Wyvern Exchange
    const WyvernExchangeFactory: WyvernExchange__factory = await ethers.getContractFactory('WyvernExchange');
    WyvernExchange = (await upgrades.deployProxy(
      WyvernExchangeFactory,
      [ProxyRegistry.address, TokenTransferProxy.address, owner.address, account1.address],
      { initializer: '__WyvernExchange_init' },
    )) as WyvernExchange;
    await ProxyRegistry.startGrantAuthentication(WyvernExchange.address);
  });
  it('should properly upgrade exchange contract', async () => {
    const ExchangeV2Facotry = await ethers.getContractFactory('ExchangeUpgradeV2');
    console.log('Exchange Address 1:', WyvernExchange.address);
    const ExchangeV2 = await upgrades.upgradeProxy(WyvernExchange.address, ExchangeV2Facotry);
    await ExchangeV2.createTest('shouldBeSaved');
    const testMappingResultV2 = await ExchangeV2.testMapping('shouldBeSaved');
    expect(testMappingResultV2).to.equal(true);
    console.log('Exchange Address 2:', ExchangeV2.address);
    const ExchangeV3Facotry = await ethers.getContractFactory('ExchangeUpgradeV3');
    const ExchangeV3 = await upgrades.upgradeProxy(WyvernExchange.address, ExchangeV3Facotry);
    console.log('Exchange Address 3:', ExchangeV3.address);
    const testMappingResultV3 = await ExchangeV3.testMapping('shouldBeSaved');
    expect(await ExchangeV3.uselessFunction()).to.equal(2);
    expect(testMappingResultV3).to.equal(true);
  });
  it('owner should be deployer', async () => {
    expect(await WyvernExchange.owner()).to.equal(owner.address);
  });
  it('should be deployed properly', async () => {
    expect(await WyvernExchange.name()).to.equal('Project Wyvern Exchange');
  });
  it('should match order hash', async () => {
    const accounts = await ethers.getSigners();
    const buy = makeOrder(WyvernExchange.address, true, accounts, ProxyRegistry.address, '0x', '0x');
    const hash = hashOrder(buy);
    const hashFromContract = await WyvernExchange.hashOrder_(
      [buy.exchange, buy.maker, buy.taker, buy.feeRecipient, buy.target, buy.staticTarget, buy.paymentToken],
      [
        buy.makerRelayerFee,
        buy.takerRelayerFee,
        buy.makerProtocolFee,
        buy.takerProtocolFee,
        buy.basePrice,
        buy.extra,
        buy.listingTime,
        buy.expirationTime,
        buy.salt,
      ],
      buy.feeMethod,
      buy.side,
      buy.saleKind,
      buy.howToCall,
      buy.calldata,
      buy.replacementPattern,
      buy.staticExtradata,
    );
    expect(hash).to.equal(hashFromContract);
  });
  it('should match order', async () => {
    const accounts = await ethers.getSigners();
    EstNFT.setApprovalForAll(WyvernExchange.address, true);
    const buyCalldata = EstNFT.interface.encodeFunctionData('transferFrom', [
      constants.AddressZero,
      accounts[1].address,
      '1',
    ]);
    const sellCaldata = EstNFT.interface.encodeFunctionData('transferFrom', [
      accounts[0].address,
      constants.AddressZero,
      '1',
    ]);
    const buy = makeOrder(
      WyvernExchange.address,
      true,
      accounts,
      ProxyRegistry.address,
      buyCalldata,
      replacementPatternBuy,
    );
    buy.taker = constants.AddressZero;
    const sell = makeOrder(
      WyvernExchange.address,
      false,
      accounts,
      ProxyRegistry.address,
      sellCaldata,
      replacementPatternSell,
    );
    sell.maker = accounts[0].address;
    sell.taker = accounts[1].address;
    buy.maker = accounts[1].address;
    buy.taker = constants.AddressZero;
    sell.side = 1;
    buy.target = EstNFT.address;
    sell.target = EstNFT.address;
    buy.salt = BigNumber.from(11);
    sell.salt = BigNumber.from(21);
    console.log(accounts[0].address, 'Account 0');
    console.log(accounts[1].address, 'Account 1');

    const buyHash = hashOrder(buy);
    const sellHash = hashOrder(sell);
    // const buySig = await accounts[0].signMessage(buyHash);
    // const sellSig = await accounts[1].signMessage(sellHash);
    const buySig = await web3.eth.sign(buyHash, accounts[1].address);
    const sellSig = await web3.eth.sign(sellHash, accounts[0].address);
    // console.log(buySig);
    // console.log(await web3.eth.sign(buyHash, accounts[0].address));
    // console.log(sellSig);
    // console.log(await web3.eth.sign(sellHash, accounts[1].address));
    const splitBuySig = ethers.utils.splitSignature(buySig);
    const splitSellSig = ethers.utils.splitSignature(sellSig);
    await expect(
      WyvernExchange.atomicMatch_(
        [
          buy.exchange,
          buy.maker,
          buy.taker,
          buy.feeRecipient,
          buy.target,
          buy.staticTarget,
          buy.paymentToken,
          sell.exchange,
          sell.maker,
          sell.taker,
          sell.feeRecipient,
          sell.target,
          sell.staticTarget,
          sell.paymentToken,
        ],
        [
          buy.makerRelayerFee,
          buy.takerRelayerFee,
          buy.makerProtocolFee,
          buy.takerProtocolFee,
          buy.basePrice,
          buy.extra,
          buy.listingTime,
          buy.expirationTime,
          buy.salt,
          sell.makerRelayerFee,
          sell.takerRelayerFee,
          sell.makerProtocolFee,
          sell.takerProtocolFee,
          sell.basePrice,
          sell.extra,
          sell.listingTime,
          sell.expirationTime,
          sell.salt,
        ],
        [
          buy.feeMethod,
          buy.side,
          buy.saleKind,
          buy.howToCall,
          sell.feeMethod,
          sell.side,
          sell.saleKind,
          sell.howToCall,
        ],
        buy.calldata,
        sell.calldata,
        buy.replacementPattern,
        sell.replacementPattern,
        buy.staticExtradata,
        sell.staticExtradata,
        [splitBuySig.v, splitSellSig.v],
        [splitBuySig.r, splitBuySig.s, splitSellSig.r, splitSellSig.s, constants.HashZero],
      ),
    ).to.emit(WyvernExchange, 'OrdersMatched');
  });

  describe('Offer and Cancelled Offer', () => {
    it('should cancel order', async () => {
      const accounts = await ethers.getSigners();
      EstNFT.connect(account1).setApprovalForAll(WyvernExchange.address, true);

      const buyCalldata = EstNFT.interface.encodeFunctionData('transferFrom', [
        constants.AddressZero,
        account2.address,
        '1',
      ]);

      const buy = makeOrder(
        WyvernExchange.address,
        true,
        accounts,
        ProxyRegistry.address,
        buyCalldata,
        replacementPatternBuy,
      );
      buy.maker = account2.address;
      buy.taker = constants.AddressZero;
      buy.target = EstNFT.address;
      buy.makerRelayerFee = 850;
      buy.feeMethod = 1;

      const buyHash = hashOrder(buy);
      const buySig = await web3.eth.sign(buyHash, account2.address);
      const splitBuySig = ethers.utils.splitSignature(buySig);
      await expect(
        WyvernExchange.connect(account2).cancelOrder_(
          [
            buy.exchange,
            buy.maker,
            buy.taker,
            buy.feeRecipient,
            buy.target,
            buy.staticTarget,
            buy.paymentToken,
          ],
          [
            buy.makerRelayerFee,
            buy.takerRelayerFee,
            buy.makerProtocolFee,
            buy.takerProtocolFee,
            buy.basePrice,
            buy.extra,
            buy.listingTime,
            buy.expirationTime,
            buy.salt,
          ],
         
            buy.feeMethod,
            buy.side,
            buy.saleKind,
            buy.howToCall,
      
          buy.calldata,
          buy.replacementPattern,
          buy.staticExtradata,
          splitBuySig.v,
          splitBuySig.r, 
          splitBuySig.s
        ),
      ).to.emit(WyvernExchange, 'OrderCancelled');
    });
  });


  describe('Listing and Cancelled Listing', () => {
    it('should cancel order', async () => {
      const accounts = await ethers.getSigners();
      EstNFT.connect(account1).setApprovalForAll(WyvernExchange.address, true);

      const sellCalldata = EstNFT.interface.encodeFunctionData('transferFrom', [
        constants.AddressZero,
        account1.address,
        '1',
      ]);

      const sell = makeOrder(
        WyvernExchange.address,
        true,
        accounts,
        ProxyRegistry.address,
        sellCalldata,
        replacementPatternBuy,
      );
      sell.maker = account1.address;
      sell.taker = constants.AddressZero;
      sell.target = EstNFT.address;
      sell.side = 1;
      sell.makerRelayerFee = 850;
      sell.feeMethod = 1;

      const sellHash = hashOrder(sell);
      const sellSig = await web3.eth.sign(sellHash, account1.address);
      const splitSellSig = ethers.utils.splitSignature(sellSig);
      await expect(
        WyvernExchange.connect(account1).cancelOrder_(
          [
            sell.exchange,
            sell.maker,
            sell.taker,
            sell.feeRecipient,
            sell.target,
            sell.staticTarget,
            sell.paymentToken,
          ],
          [
            sell.makerRelayerFee,
            sell.takerRelayerFee,
            sell.makerProtocolFee,
            sell.takerProtocolFee,
            sell.basePrice,
            sell.extra,
            sell.listingTime,
            sell.expirationTime,
            sell.salt,
          ],
         
            sell.feeMethod,
            sell.side,
            sell.saleKind,
            sell.howToCall,
      
          sell.calldata,
          sell.replacementPattern,
          sell.staticExtradata,
          splitSellSig.v,
          splitSellSig.r, 
          splitSellSig.s
        ),
      ).to.emit(WyvernExchange, 'OrderCancelled');
    });
  });

});

