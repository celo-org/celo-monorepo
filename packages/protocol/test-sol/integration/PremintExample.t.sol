// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { Test, console2 as console } from "celo-foundry/Test.sol";

import "../utils/GovernanceHelpers.sol";

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
// import "mobius/contracts/Swap.sol";

import "contracts/common/Registry.sol";
import "contracts/common/Proxy.sol";
import "contracts/governance/Governance.sol";
import "contracts/governance/Proposals.sol";
import "contracts/governance/interfaces/ILockedGold.sol";
import "contracts/stability/StableTokenMintableByOwner.sol";

interface Pool {
  function addLiquidity(uint256[] calldata amounts, uint256 minToMint) external returns (uint256);
  function removeLiquidity(uint256 amount, uint256[] calldata minAmounts, uint256 deadline)
    external
    returns (uint256);
  function getLpToken() external returns (address);
  function pause() external;
  function transferOwnership(address newOwner) external;
}

contract PremintExample is GovernanceHelpers {
  StableTokenMintableByOwner stableTokenMintableByOwner;
  address payable stableTokenProxyAddress;
  address stableTokenImplementationAddress;
  address constant USDC = 0x37f750B7cC259A2f741AF45294f6a16572CF5cAd;
  address constant StableTokenMintableByOwnerAddr = 0x41a2887d4C4D96C9E1a3505CF4553Fd0b1380F13;
  // address constant MOBIUS_POOL = 0xC0BA93D4aaf90d39924402162EE4a213300d1d60;
  address constant MOBIUS_POOL = 0x2D3f58f8020761369f5c324ea7e35b149f2aBEb5;
  uint256 constant amountToDeposit_cUSD = 2_000_000_000_000_000_000_000_000;
  uint256 constant amountToDeposit_USDC = 1_000_000_000_000;
  address governanceAddr;
  address poolLpToken;
  Pool pool;

  function setUp() public {
    vm.label(USDC, "USDC");
    vm.label(MOBIUS_POOL, "MOBIUS_POOL");
    vm.selectFork(mainnetForkId);
    governanceAddr = registry.getAddressForString("Governance");
    vm.label(governanceAddr, "Governance");
    pool = Pool(MOBIUS_POOL);

    stableTokenMintableByOwner = StableTokenMintableByOwner(StableTokenMintableByOwnerAddr);
    stableTokenProxyAddress = address(uint160(registry.getAddressForString("StableToken")));
    stableTokenImplementationAddress = Proxy(stableTokenProxyAddress)._getImplementation();
    deal(USDC, governanceAddr, amountToDeposit_USDC);
    poolLpToken = pool.getLpToken();
  }

  function test_simulateProposals_bothSides() external {
    executeProposal(mintAndAddLiquidity_bothSides(), "mint_and_add_liquidity_bothSides");
    address USDC_dest = vm.addr(0x222);
    changePrank(governanceAddr);
    executeProposal(removeLiquidityAndBurn(USDC_dest), "remove_liquidity_and_burn");
    require(IERC20(USDC).balanceOf(USDC_dest) == amountToDeposit_USDC);
    console.log(IERC20(poolLpToken).balanceOf(governanceAddr));
  }

  function test_simulateProposals_cUSD() external {
    executeProposal(mintAndAddLiquidity_cUSD(), "mint_and_add_liquidity_cUSD");
    console.log(IERC20(poolLpToken).balanceOf(governanceAddr));
  }

  function test_simulateProposals_USDC() external {
    executeProposal(mintAndAddLiquidity_USDC(), "mint_and_add_liquidity_USDC");
    console.log(IERC20(poolLpToken).balanceOf(governanceAddr));
  }

  function mintAndAddLiquditiySimulated() internal {
    changePrank(governanceAddr);
    Proxy(stableTokenProxyAddress)._setImplementation(address(stableTokenMintableByOwner));
    StableTokenMintableByOwner(stableTokenProxyAddress).mint(governanceAddr, amountToDeposit_cUSD);
    IERC20(stableTokenProxyAddress).approve(MOBIUS_POOL, amountToDeposit_cUSD);
    IERC20(USDC).approve(MOBIUS_POOL, amountToDeposit_USDC);
    uint256 lpTokens = IERC20(poolLpToken).balanceOf(governanceAddr);
    uint256[] memory amounts = new uint256[](2);
    amounts[0] = amountToDeposit_cUSD;
    amounts[1] = amountToDeposit_USDC;
    pool.addLiquidity(amounts, 0);
  }

  function mintAndAddLiquidity_USDC()
    internal
    view
    returns (Proposals.Transaction[] memory transactions)
  {
    transactions = new Proposals.Transaction[](2);
    transactions[0] = Proposals.Transaction(
      0,
      USDC,
      abi.encodeWithSignature("approve(address,uint256)", MOBIUS_POOL, amountToDeposit_USDC)
    );
    uint256[] memory amounts = new uint256[](2);
    amounts[0] = 0;
    amounts[1] = amountToDeposit_USDC;
    transactions[1] = Proposals.Transaction(
      0,
      MOBIUS_POOL,
      abi.encodeWithSignature("addLiquidity(uint256[],uint256)", amounts, 0)
    );
  }

  function mintAndAddLiquidity_cUSD()
    internal
    view
    returns (Proposals.Transaction[] memory transactions)
  {
    transactions = new Proposals.Transaction[](5);
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
    uint256[] memory amounts = new uint256[](2);
    amounts[0] = amountToDeposit_cUSD;
    amounts[1] = 0;
    transactions[4] = Proposals.Transaction(
      0,
      MOBIUS_POOL,
      abi.encodeWithSignature("addLiquidity(uint256[],uint256)", amounts, 0)
    );
  }

  function mintAndAddLiquidity_bothSides()
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
      abi.encodeWithSignature("addLiquidity(uint256[],uint256)", amounts, 0)
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
    amounts[0] = amountToDeposit_cUSD;
    amounts[1] = amountToDeposit_USDC;
    transactions[0] = Proposals.Transaction(
      0,
      poolLpToken,
      abi.encodeWithSignature("approve(address,uint256)", MOBIUS_POOL, lpTokens)
    );
    transactions[1] = Proposals.Transaction(
      0,
      MOBIUS_POOL,
      abi.encodeWithSignature(
        "removeLiquidity(uint256,uint256[],uint256)",
        lpTokens,
        amounts,
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
      abi.encodeWithSignature("burn(uint256)", amountToDeposit_cUSD)
    );
    transactions[4] = Proposals.Transaction(
      0,
      stableTokenProxyAddress,
      abi.encodeWithSignature("_setImplementation(address)", stableTokenImplementationAddress)
    );
    transactions[5] = Proposals.Transaction(
      0,
      USDC,
      abi.encodeWithSignature("transfer(address,uint256)", USDC_dest, amountToDeposit_USDC)
    );
  }
}
