// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { Test } from "celo-foundry/Test.sol";

import { IPairManager } from "contracts/stability/interfaces/IPairManager.sol";

import { PairManager } from "contracts/stability/PairManager.sol";
import { Broker } from "contracts/stability/Broker.sol";
import { CPExchange } from "contracts/stability/exchanges/CPExchange.sol";
import { StableToken } from "contracts/stability/StableToken.sol";
import { Reserve } from "contracts/stability/Reserve.sol";

import { FixidityLib } from "contracts/common/FixidityLib.sol";

import { WithRegistry } from "./WithRegistry.sol";
import { Token } from "./Token.sol";

contract McMintIntegration is WithRegistry {
  using FixidityLib for FixidityLib.Fraction;

  uint256 constant tobinTaxStalenessThreshold = 600;
  uint256 constant dailySpendingRatio = 1000000000000000000000000;
  uint256 constant sortedOraclesDenominator = 1000000000000000000000000;
  uint256 tobinTax = FixidityLib.newFixedFraction(5, 1000).unwrap();
  uint256 tobinTaxReserveRatio = FixidityLib.newFixedFraction(2, 1).unwrap();

  Broker broker;
  PairManager pairManager;
  Reserve reserve;
  CPExchange crossProductExchange;

  Token celoToken;
  Token usdcToken;
  StableToken cUSDToken;
  StableToken cEURToken;

  IPairManager.Pair pair_cUSD_CELO;
  bytes32 pair_cUSD_CELO_ID;
  IPairManager.Pair pair_cEUR_CELO;
  bytes32 pair_cEUR_CELO_ID;
  IPairManager.Pair pair_cUSD_USDCet;
  bytes32 pair_cUSD_USDCet_ID;
  IPairManager.Pair pair_cEUR_USDCet;
  bytes32 pair_cEUR_USDCet_ID;

  constructor() public {
    /* ===== Deploy collateral and stable assets ===== */

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

    /* ===== Deploy reserve ===== */

    bytes32[] memory initialAssetAllocationSymbols = new bytes32[](2);
    uint256[] memory initialAssetAllocationWeights = new uint256[](2);
    initialAssetAllocationSymbols[0] = bytes32("cGLD");
    initialAssetAllocationWeights[0] = FixidityLib.newFixedFraction(1, 2).unwrap();
    initialAssetAllocationSymbols[1] = bytes32("USDCet");
    initialAssetAllocationWeights[1] = FixidityLib.newFixedFraction(1, 2).unwrap();

    address[] memory collateralAssets = new address[](2);
    uint256[] memory collateralAssetDailySpendingRatios = new uint256[](2);
    collateralAssets[0] = address(celoToken);
    collateralAssetDailySpendingRatios[0] = 100000000000000000000000;
    collateralAssets[1] = address(usdcToken);
    collateralAssetDailySpendingRatios[0] = 100000000000000000000000;

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
      collateralAssets,
      collateralAssetDailySpendingRatios
    );

    /* ===== Deploy PairManager, Broker and exchange ===== */

    crossProductExchange = new CPExchange();
    pairManager = new PairManager(true);
    broker = new Broker(true);

    pairManager.initialize(address(broker), address(reserve));
    broker.initialize(address(pairManager), address(reserve));

    /* ====== Create pairs for all asset combinations ======= */

    pair_cUSD_CELO.stableAsset = address(cUSDToken);
    pair_cUSD_CELO.collateralAsset = address(celoToken);
    pair_cUSD_CELO.mentoExchange = crossProductExchange;
    pair_cUSD_CELO.stableBucket = 10**24;
    pair_cUSD_CELO.collateralBucket = 2 * 10**24;
    pair_cUSD_CELO.bucketUpdateFrequency = 60 * 5;
    pair_cUSD_CELO.lastBucketUpdate = now;
    pair_cUSD_CELO.collateralBucketFraction = FixidityLib.newFixedFraction(50, 100);
    pair_cUSD_CELO.stableBucketMaxFraction = FixidityLib.newFixedFraction(30, 100);
    pair_cUSD_CELO.spread = FixidityLib.newFixedFraction(5, 100);
    pair_cUSD_CELO.minimumReports = 5;
    pair_cUSD_CELO.minSupplyForStableBucketCap = 10**20;

    pair_cUSD_CELO_ID = pairManager.createPair(pair_cUSD_CELO);

    pair_cUSD_USDCet.stableAsset = address(cUSDToken);
    pair_cUSD_USDCet.collateralAsset = address(usdcToken);
    pair_cUSD_USDCet.mentoExchange = crossProductExchange;
    pair_cUSD_USDCet.stableBucket = 10**24;
    pair_cUSD_USDCet.collateralBucket = 2 * 10**24;
    pair_cUSD_USDCet.bucketUpdateFrequency = 60 * 5;
    pair_cUSD_USDCet.lastBucketUpdate = now;
    pair_cUSD_USDCet.collateralBucketFraction = FixidityLib.newFixedFraction(50, 100);
    pair_cUSD_USDCet.stableBucketMaxFraction = FixidityLib.newFixedFraction(30, 100);
    pair_cUSD_USDCet.spread = FixidityLib.newFixedFraction(5, 100);
    pair_cUSD_USDCet.minimumReports = 5;
    pair_cUSD_USDCet.minSupplyForStableBucketCap = 10**20;

    pair_cUSD_USDCet_ID = pairManager.createPair(pair_cUSD_USDCet);

    pair_cEUR_CELO.stableAsset = address(cEURToken);
    pair_cEUR_CELO.collateralAsset = address(celoToken);
    pair_cEUR_CELO.mentoExchange = crossProductExchange;
    pair_cEUR_CELO.stableBucket = 10**24;
    pair_cEUR_CELO.collateralBucket = 2 * 10**24;
    pair_cEUR_CELO.bucketUpdateFrequency = 60 * 5;
    pair_cEUR_CELO.lastBucketUpdate = now;
    pair_cEUR_CELO.collateralBucketFraction = FixidityLib.newFixedFraction(50, 100);
    pair_cEUR_CELO.stableBucketMaxFraction = FixidityLib.newFixedFraction(30, 100);
    pair_cEUR_CELO.spread = FixidityLib.newFixedFraction(5, 100);
    pair_cEUR_CELO.minimumReports = 5;
    pair_cEUR_CELO.minSupplyForStableBucketCap = 10**20;

    pair_cEUR_CELO_ID = pairManager.createPair(pair_cEUR_CELO);

    pair_cEUR_USDCet.stableAsset = address(cEURToken);
    pair_cEUR_USDCet.collateralAsset = address(usdcToken);
    pair_cEUR_USDCet.mentoExchange = crossProductExchange;
    pair_cEUR_USDCet.stableBucket = 10**24;
    pair_cEUR_USDCet.collateralBucket = 2 * 10**24;
    pair_cEUR_USDCet.bucketUpdateFrequency = 60 * 5;
    pair_cEUR_USDCet.lastBucketUpdate = now;
    pair_cEUR_USDCet.collateralBucketFraction = FixidityLib.newFixedFraction(50, 100);
    pair_cEUR_USDCet.stableBucketMaxFraction = FixidityLib.newFixedFraction(30, 100);
    pair_cEUR_USDCet.spread = FixidityLib.newFixedFraction(5, 100);
    pair_cEUR_USDCet.minimumReports = 5;
    pair_cEUR_USDCet.minSupplyForStableBucketCap = 10**20;

    pair_cEUR_CELO_ID = pairManager.createPair(pair_cEUR_USDCet);
  }
}
