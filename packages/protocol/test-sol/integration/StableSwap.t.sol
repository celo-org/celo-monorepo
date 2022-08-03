// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { Test, console2 as console } from "celo-foundry/Test.sol";
import { StableToken } from "contracts/stability/StableToken.sol";
import { TokenHelpers } from "../utils/TokenHelpers.sol";
import { WithForks } from "../utils/WithForks.sol";
import { WithRegistry } from "../utils/WithRegistry.sol";
import { IERC20 } from "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

interface Pool {
  function addLiquidity(uint256[] calldata amounts, uint256 minToMint, uint256 deadline)
    external
    returns (uint256);
  function removeLiquidity(uint256 amount, uint256[] calldata minAmounts, uint256 deadline)
    external
    returns (uint256);
  function getLpToken() external returns (address);
  function pause() external;
  function transferOwnership(address newOwner) external;
  function swap(
    uint8 tokenIndexFrom,
    uint8 tokenIndexTo,
    uint256 dx,
    uint256 minDy,
    uint256 deadline
  ) external returns (uint256);
  function getBalances() external view returns (uint256[] memory);
}

contract StableSwapExperiment is Test, TokenHelpers, WithForks, WithRegistry {
  address constant USDC = 0x37f750B7cC259A2f741AF45294f6a16572CF5cAd;
  address constant MOBIUS_POOL = 0xb88d9a72b192C4b5C043EDA1E152a0BeC2f94212;
  Pool constant pool = Pool(MOBIUS_POOL);

  StableToken stableToken;

  address alice;
  address bob;
  address charlie;
  address david;
  IERC20 lpToken;

  constructor() public WithRegistry(true) {}

  function setUp() public {
    vm.selectFork(mainnetForkId);
    vm.label(USDC, "USDC");
    vm.label(MOBIUS_POOL, "MOBIUS_POOL");
    stableToken = StableToken(registry.getAddressForString("StableToken"));
    lpToken = IERC20(pool.getLpToken());

    alice = setupActor("alice", 1000_000000000000000000, 1000_000000);
    bob = setupActor("bob", 1000_000000000000000000, 1000_000000);
    charlie = setupActor("charlie", 1000_000000000000000000, 1000_000000);
    david = setupActor("david", 1000_000000000000000000, 1000_000000);
  }

  function test_depositSwapDeposit() public {
    changePrank(alice);
    pool.addLiquidity(amounts(1000_000000000000000000, 1000_000000), 0, now + 1);
    console.log("Alice LP", lpToken.balanceOf(alice));

    changePrank(bob);
    uint256 swapResult = pool.swap(0, 1, 1000_000000000000000000, 900_000000, now + 1);
    console.log("Swap result 1000 cUSD for:", swapResult);
    logPoolBalances();

    changePrank(charlie);
    pool.addLiquidity(amounts(1000_000000000000000000, 0), 0, now + 1);
    console.log("Charlie LP", lpToken.balanceOf(charlie));
    logPoolBalances();

    changePrank(david);
    pool.addLiquidity(amounts(1000_000000000000000000, 1000_000000), 0, now + 1);
    console.log("David LP", lpToken.balanceOf(david));
    logPoolBalances();
  }

  function logPoolBalances() internal view {
    uint256[] memory balances = pool.getBalances();
    console.log("Pool cUSD", balances[0]);
    console.log("Pool USDC", balances[1]);
  }

  function amounts(uint256 cUSD_amount, uint256 USDC_amount)
    internal
    pure
    returns (uint256[] memory ams)
  {
    ams = new uint256[](2);
    ams[0] = cUSD_amount;
    ams[1] = USDC_amount;
    return ams;
  }

  function setupActor(string memory name, uint256 cUSD_balance, uint256 USDC_balance)
    internal
    returns (address)
  {
    address addr = actor(name);
    mint(stableToken, addr, cUSD_balance);
    deal(USDC, addr, USDC_balance);
    deal(addr, 1000_000000000000000000);

    changePrank(addr);
    IERC20(USDC).approve(MOBIUS_POOL, uint256(-1));
    stableToken.approve(MOBIUS_POOL, uint256(-1));
    changePrank(address(this));
    return addr;
  }

}
