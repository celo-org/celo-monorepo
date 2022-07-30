// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { Test, console2 as console } from "celo-foundry/Test.sol";

import "../utils/GovernanceHelpers.sol";

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

import "contracts/common/Registry.sol";
import "contracts/common/Proxy.sol";
import "contracts/governance/Governance.sol";
import "contracts/governance/Proposals.sol";
import "contracts/governance/interfaces/ILockedGold.sol";
import "contracts/stability/StableTokenMintableByOwner.sol";

interface MobiusSwapPool {
  function addLiquidity(uint256[] calldata amounts, uint256 minToMint, uint256 deadline)
    external
    returns (uint256);
  function removeLiquidityImbalance(uint256[] calldata amounts, uint256 maxToBurn, uint256 deadline)
    external
    returns (uint256);
  function getLpToken() external returns (address);
}

contract PremintExample is GovernanceHelpers {
  StableTokenMintableByOwner stableTokenMintableByOwner;
  address payable stableTokenProxyAddress;
  address stableTokenImplementationAddress;
  address constant USDC = 0x37f750B7cC259A2f741AF45294f6a16572CF5cAd;
  address constant MOBIUS_POOL = 0xC0BA93D4aaf90d39924402162EE4a213300d1d60;
  uint256 constant amountToDeposit_cUSD = 2_000_000_000_000_000_000_000_000;
  uint256 constant amountToDeposit_USDC = 2_000_000_000_000;
  address governanceAddr;
  address poolLpToken;

  function setUp() public {
    vm.selectFork(mainnetForkId);
    governanceAddr = registry.getAddressForString("Governance");

    stableTokenMintableByOwner = new StableTokenMintableByOwner(false);
    stableTokenProxyAddress = address(uint160(registry.getAddressForString("StableToken")));
    stableTokenImplementationAddress = Proxy(stableTokenProxyAddress)._getImplementation();
    deal(USDC, governanceAddr, amountToDeposit_USDC);
    poolLpToken = MobiusSwapPool(MOBIUS_POOL).getLpToken();
  }

  function test_simulateProposals() external {
    executeProposal(mintAndAddLiquidity(), "mint_and_add_liquidity");
    address USDC_dest = vm.addr(0x222);
    executeProposal(removeLiquidityAndBurn(USDC_dest), "remove_liquidity_and_burn");
    require(IERC20(USDC).balanceOf(USDC_dest) == amountToDeposit_USDC - 2000000000);
    console.log(IERC20(poolLpToken).balanceOf(governanceAddr));
  }

  function mintAndAddLiquditiySimulated() internal {
    changePrank(governanceAddr);
    Proxy(stableTokenProxyAddress)._setImplementation(address(stableTokenMintableByOwner));
    StableTokenMintableByOwner(stableTokenProxyAddress).mint(governanceAddr, amountToDeposit_cUSD);
    IERC20(stableTokenProxyAddress).approve(MOBIUS_POOL, amountToDeposit_cUSD);
    IERC20(USDC).approve(MOBIUS_POOL, amountToDeposit_USDC);
    uint256[] memory amounts = new uint256[](2);
    amounts[0] = amountToDeposit_cUSD;
    amounts[1] = amountToDeposit_USDC;
    MobiusSwapPool(MOBIUS_POOL).addLiquidity(amounts, 0, now + 10000);
  }

  function mintAndAddLiquidity()
    internal
    view
    returns (Proposals.Transaction[] memory transactions)
  {
    transactions = new Proposals.Transaction[](6);
    transactions[0] = Proposals.Transaction(
      0,
      stableTokenProxyAddress,
      abi.encodeWithSignature("_setImplementation(address)", address(stableTokenMintableByOwner))
    );
    transactions[1] = Proposals.Transaction(
      0,
      stableTokenProxyAddress,
      abi.encodeWithSignature("mint(address,uint256)", governanceAddr, amountToDeposit_cUSD)
    );
    transactions[2] = Proposals.Transaction(
      0,
      stableTokenProxyAddress,
      abi.encodeWithSignature("_setImplementation(address)", stableTokenImplementationAddress)
    );
    transactions[3] = Proposals.Transaction(
      0,
      stableTokenProxyAddress,
      abi.encodeWithSignature("approve(address,uint256)", MOBIUS_POOL, amountToDeposit_cUSD)
    );
    transactions[4] = Proposals.Transaction(
      0,
      USDC,
      abi.encodeWithSignature("approve(address,uint256)", MOBIUS_POOL, amountToDeposit_USDC)
    );
    uint256[] memory amounts = new uint256[](2);
    amounts[0] = amountToDeposit_cUSD;
    amounts[1] = amountToDeposit_USDC;
    transactions[5] = Proposals.Transaction(
      0,
      MOBIUS_POOL,
      abi.encodeWithSignature("addLiquidity(uint256[],uint256,uint256)", amounts, 0, now + 1000000)
    );
  }

  function removeLiquidityAndBurn(address USDC_dest)
    internal
    view
    returns (Proposals.Transaction[] memory transactions)
  {
    uint256 lpTokens = IERC20(poolLpToken).balanceOf(governanceAddr);
    transactions = new Proposals.Transaction[](6);
    uint256[] memory amounts = new uint256[](2);
    amounts[0] = amountToDeposit_cUSD - 2000000000000000000000;
    amounts[1] = amountToDeposit_USDC - 2000000000;
    transactions[0] = Proposals.Transaction(
      0,
      poolLpToken,
      abi.encodeWithSignature("approve(address,uint256)", MOBIUS_POOL, lpTokens)
    );
    transactions[1] = Proposals.Transaction(
      0,
      MOBIUS_POOL,
      abi.encodeWithSignature(
        "removeLiquidityImbalance(uint256[],uint256,uint256)",
        amounts,
        lpTokens,
        now + 1000000
      )
    );
    transactions[2] = Proposals.Transaction(
      0,
      stableTokenProxyAddress,
      abi.encodeWithSignature("_setImplementation(address)", address(stableTokenMintableByOwner))
    );
    transactions[3] = Proposals.Transaction(
      0,
      stableTokenProxyAddress,
      abi.encodeWithSignature("burn(uint256)", amountToDeposit_cUSD - 2000000000000000000000)
    );
    transactions[4] = Proposals.Transaction(
      0,
      stableTokenProxyAddress,
      abi.encodeWithSignature("_setImplementation(address)", stableTokenImplementationAddress)
    );
    transactions[5] = Proposals.Transaction(
      0,
      USDC,
      abi.encodeWithSignature(
        "transfer(address,uint256)",
        USDC_dest,
        amountToDeposit_USDC - 2000000000
      )
    );
  }
}
