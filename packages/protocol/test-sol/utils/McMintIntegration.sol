// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { Test } from "celo-foundry/Test.sol";

import { MockSortedOracles } from "contracts/stability/test/MockSortedOracles.sol";

import { IExchangeProvider } from "contracts/stability/interfaces/IExchangeProvider.sol";
import { IPricingModule } from "contracts/stability/interfaces/IPricingModule.sol";
import { IReserve } from "contracts/stability/interfaces/IReserve.sol";
import { ISortedOracles } from "contracts/stability/interfaces/ISortedOracles.sol";

import { BiPoolManager } from "contracts/stability/BiPoolManager.sol";
import { Broker } from "contracts/stability/Broker.sol";
import { ConstantProductPricingModule } from "contracts/stability/ConstantProductPricingModule.sol";
import { StableToken } from "contracts/stability/StableToken.sol";
import { Reserve } from "contracts/stability/Reserve.sol";

import { FixidityLib } from "contracts/common/FixidityLib.sol";
import { Freezer } from "contracts/common/Freezer.sol";

import { WithRegistry } from "./WithRegistry.sol";
import { Token } from "./Token.sol";

contract McMintIntegration is Test, WithRegistry {
  using FixidityLib for FixidityLib.Fraction;

  uint256 constant tobinTaxStalenessThreshold = 600;
  uint256 constant dailySpendingRatio = 1000000000000000000000000;
  uint256 constant sortedOraclesDenominator = 1000000000000000000000000;
  uint256 tobinTax = FixidityLib.newFixedFraction(5, 1000).unwrap();
  uint256 tobinTaxReserveRatio = FixidityLib.newFixedFraction(2, 1).unwrap();

  Broker broker;
  BiPoolManager biPoolManager;
  Reserve reserve;
  IPricingModule constantProduct;

  MockSortedOracles sortedOracles;

  Token celoToken;
  Token usdcToken;
  StableToken cUSDToken;
  StableToken cEURToken;
  Freezer freezer;

  address cUSD_CELO_oracleReportTarget;
  address cEUR_CELO_oracleReportTarget;
  address cUSD_USDCet_oracleReportTarget;
  address cEUR_USDCet_oracleReportTarget;
  address cUSD_cEUR_oracleReportTarget;

  bytes32 pair_cUSD_CELO_ID;
  bytes32 pair_cEUR_CELO_ID;
  bytes32 pair_cUSD_USDCet_ID;
  bytes32 pair_cEUR_USDCet_ID;
  bytes32 pair_cUSD_cEUR_ID;

  function setUp_mcMint() public {
    vm.warp(60 * 60 * 24 * 10); // Start at a non-zero timestamp.

    /* ===== Deploy collateral and stable assets ===== */

    changePrank(actor("deployer"));
    celoToken = new Token("Celo", "cGLD", 18);
    usdcToken = new Token("USDCet", "USDCet", 18);

    address[] memory initialAddresses = new address[](0);
    uint256[] memory initialBalances = new uint256[](0);

    cUSDToken = new StableToken(true);
    cUSDToken.initialize(
      "cUSD",
      "cUSD",
      18,
      registryAddress,
      FixidityLib.unwrap(FixidityLib.fixed1()),
      60 * 60 * 24 * 7,
      initialAddresses,
      initialBalances,
      "Broker"
    );

    cEURToken = new StableToken(true);
    cEURToken.initialize(
      "cEUR",
      "cEUR",
      18,
      registryAddress,
      FixidityLib.unwrap(FixidityLib.fixed1()),
      60 * 60 * 24 * 7,
      initialAddresses,
      initialBalances,
      "Broker"
    );

    vm.label(address(cUSDToken), "cUSD");
    vm.label(address(cEURToken), "cEUR");

    /* ===== Deploy reserve ===== */

    bytes32[] memory initialAssetAllocationSymbols = new bytes32[](2);
    uint256[] memory initialAssetAllocationWeights = new uint256[](2);
    initialAssetAllocationSymbols[0] = bytes32("cGLD");
    initialAssetAllocationWeights[0] = FixidityLib.newFixedFraction(1, 2).unwrap();
    initialAssetAllocationSymbols[1] = bytes32("USDCet");
    initialAssetAllocationWeights[1] = FixidityLib.newFixedFraction(1, 2).unwrap();

    address[] memory asse1s = new address[](2);
    uint256[] memory asse1DailySpendingRatios = new uint256[](2);
    asse1s[0] = address(celoToken);
    asse1DailySpendingRatios[0] = 100000000000000000000000;
    asse1s[1] = address(usdcToken);
    asse1DailySpendingRatios[0] = 100000000000000000000000;

    reserve = new Reserve(true);
    reserve.initialize(
      registryAddress,
      tobinTaxStalenessThreshold,
      dailySpendingRatio,
      0,
      0,
      initialAssetAllocationSymbols,
      initialAssetAllocationWeights,
      tobinTax,
      tobinTaxReserveRatio,
      asse1s,
      asse1DailySpendingRatios
    );

    reserve.addToken(address(cUSDToken));
    reserve.addToken(address(cEURToken));

    /* ===== Deploy SortedOracles ===== */

    sortedOracles = new MockSortedOracles();

    cUSD_CELO_oracleReportTarget = address(cUSDToken);
    cEUR_CELO_oracleReportTarget = address(cEURToken);
    cUSD_USDCet_oracleReportTarget = address(bytes20(keccak256("USD/USDC")));
    cEUR_USDCet_oracleReportTarget = address(bytes20(keccak256("EUR/USDC")));
    cUSD_cEUR_oracleReportTarget = address(bytes20(keccak256("USD/EUR")));

    sortedOracles.setMedianRate(cUSD_CELO_oracleReportTarget, 5e23);
    sortedOracles.setNumRates(cUSD_CELO_oracleReportTarget, 10);
    sortedOracles.setMedianRate(cEUR_CELO_oracleReportTarget, 5e23);
    sortedOracles.setNumRates(cEUR_CELO_oracleReportTarget, 10);
    sortedOracles.setMedianRate(cUSD_USDCet_oracleReportTarget, 1.02 * 1e24);
    sortedOracles.setNumRates(cUSD_USDCet_oracleReportTarget, 10);
    sortedOracles.setMedianRate(cEUR_USDCet_oracleReportTarget, 0.9 * 1e24);
    sortedOracles.setNumRates(cEUR_USDCet_oracleReportTarget, 10);
    sortedOracles.setMedianRate(cUSD_cEUR_oracleReportTarget, 1.1 * 1e24);
    sortedOracles.setNumRates(cUSD_cEUR_oracleReportTarget, 10);

    /* ===== Deploy BiPoolManager & Broker ===== */

    constantProduct = IPricingModule(new ConstantProductPricingModule(true));
    biPoolManager = new BiPoolManager(true);
    // biPoolManager = new PairManager(true);
    broker = new Broker(true);

    biPoolManager.initialize(
      address(broker),
      IReserve(reserve),
      ISortedOracles(address(sortedOracles))
    );
    address[] memory exchangeProviders = new address[](1);
    exchangeProviders[0] = address(biPoolManager);

    broker.initialize(exchangeProviders, address(reserve));
    registry.setAddressFor("Broker", address(broker));
    reserve.addExchangeSpender(address(broker));

    /* ====== Create pairs for all asset combinations ======= */

    BiPoolManager.PoolExchange memory pair_cUSD_CELO;
    pair_cUSD_CELO.asset0 = address(cUSDToken);
    pair_cUSD_CELO.asset1 = address(celoToken);
    pair_cUSD_CELO.pricingModule = constantProduct;
    pair_cUSD_CELO.lastBucketUpdate = now;
    pair_cUSD_CELO.config.spread = FixidityLib.newFixedFraction(5, 100);
    pair_cUSD_CELO.config.bucketUpdateFrequency = 60 * 5;
    pair_cUSD_CELO.config.minimumReports = 5;
    pair_cUSD_CELO.config.oracleReportTarget = cUSD_CELO_oracleReportTarget;
    pair_cUSD_CELO.config.bucket0TargetSize = 1e24;
    pair_cUSD_CELO.config.bucket0MaxFraction = FixidityLib.wrap(5e23);

    pair_cUSD_CELO_ID = biPoolManager.createExchange(pair_cUSD_CELO);

    BiPoolManager.PoolExchange memory pair_cEUR_CELO;
    pair_cEUR_CELO.asset0 = address(cEURToken);
    pair_cEUR_CELO.asset1 = address(celoToken);
    pair_cEUR_CELO.pricingModule = constantProduct;
    pair_cEUR_CELO.lastBucketUpdate = now;
    pair_cEUR_CELO.config.spread = FixidityLib.newFixedFraction(5, 100);
    pair_cEUR_CELO.config.bucketUpdateFrequency = 60 * 5;
    pair_cEUR_CELO.config.minimumReports = 5;
    pair_cEUR_CELO.config.oracleReportTarget = cEUR_CELO_oracleReportTarget;
    pair_cEUR_CELO.config.bucket0TargetSize = 1e24;
    pair_cEUR_CELO.config.bucket0MaxFraction = FixidityLib.wrap(5e23);

    pair_cEUR_CELO_ID = biPoolManager.createExchange(pair_cEUR_CELO);

    BiPoolManager.PoolExchange memory pair_cUSD_USDCet;
    pair_cUSD_USDCet.asset0 = address(cUSDToken);
    pair_cUSD_USDCet.asset1 = address(usdcToken);
    pair_cUSD_USDCet.pricingModule = constantProduct;
    pair_cUSD_USDCet.lastBucketUpdate = now;
    pair_cUSD_USDCet.config.spread = FixidityLib.newFixedFraction(5, 100);
    pair_cUSD_USDCet.config.bucketUpdateFrequency = 60 * 5;
    pair_cUSD_USDCet.config.minimumReports = 5;
    pair_cUSD_USDCet.config.oracleReportTarget = cUSD_USDCet_oracleReportTarget;
    pair_cUSD_USDCet.config.bucket0TargetSize = 1e24;
    pair_cUSD_USDCet.config.bucket0MaxFraction = FixidityLib.wrap(5e23);

    pair_cUSD_USDCet_ID = biPoolManager.createExchange(pair_cUSD_USDCet);

    BiPoolManager.PoolExchange memory pair_cEUR_USDCet;
    pair_cEUR_USDCet.asset0 = address(cEURToken);
    pair_cEUR_USDCet.asset1 = address(usdcToken);
    pair_cEUR_USDCet.pricingModule = constantProduct;
    pair_cEUR_USDCet.lastBucketUpdate = now;
    pair_cEUR_USDCet.config.spread = FixidityLib.newFixedFraction(5, 100);
    pair_cEUR_USDCet.config.bucketUpdateFrequency = 60 * 5;
    pair_cEUR_USDCet.config.minimumReports = 5;
    pair_cEUR_USDCet.config.oracleReportTarget = cEUR_USDCet_oracleReportTarget;
    pair_cEUR_USDCet.config.bucket0TargetSize = 1e24;
    pair_cEUR_USDCet.config.bucket0MaxFraction = FixidityLib.wrap(5e23);

    pair_cEUR_USDCet_ID = biPoolManager.createExchange(pair_cEUR_USDCet);

    BiPoolManager.PoolExchange memory pair_cUSD_cEUR;
    pair_cUSD_cEUR.asset0 = address(cUSDToken);
    pair_cUSD_cEUR.asset1 = address(cEURToken);
    pair_cUSD_cEUR.pricingModule = constantProduct;
    pair_cUSD_cEUR.lastBucketUpdate = now;
    pair_cUSD_cEUR.config.spread = FixidityLib.newFixedFraction(5, 100);
    pair_cUSD_cEUR.config.bucketUpdateFrequency = 60 * 5;
    pair_cUSD_cEUR.config.minimumReports = 5;
    pair_cUSD_cEUR.config.oracleReportTarget = cUSD_cEUR_oracleReportTarget;
    pair_cUSD_cEUR.config.bucket0TargetSize = 1e24;
    pair_cUSD_cEUR.config.bucket0MaxFraction = FixidityLib.wrap(5e23);

    pair_cUSD_cEUR_ID = biPoolManager.createExchange(pair_cUSD_cEUR);

    /* ========== Deploy Freezer =============== */
    freezer = new Freezer(true);
    registry.setAddressFor("Freezer", address(freezer));
  }
}
