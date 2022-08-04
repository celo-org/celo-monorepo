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
  function setAdminFee(uint256) external;
}

contract StableSwapExperiment is Test, TokenHelpers, WithForks, WithRegistry {
  address constant governance = 0xD533Ca259b330c7A88f74E000a3FaEa2d63B7972;
  address constant USDC = 0x37f750B7cC259A2f741AF45294f6a16572CF5cAd;
  // address constant MOBIUS_POOL = 0xb88d9a72b192C4b5C043EDA1E152a0BeC2f94212; // a = 2000
  address constant MOBIUS_POOL = 0xB52124467cBa3ef335F03272EA8C045F390deaCe; // a = 10**6 - 1

  Pool constant pool = Pool(MOBIUS_POOL);

  StableToken stableToken;

  address alice;
  address bob;
  address charlie;
  address david;
  IERC20 lpToken;

  mapping(address => string) actors;

  constructor() public WithRegistry(true) {}

  function setUp() public {
    vm.selectFork(mainnetForkId);
    vm.label(USDC, "USDC");
    vm.label(MOBIUS_POOL, "MOBIUS_POOL");
    stableToken = StableToken(registry.getAddressForString("StableToken"));
    lpToken = IERC20(pool.getLpToken());

    alice = setupActor("alice", cusd(20000000), usdc(20000000));
    bob = setupActor("bob", cusd(20000000), usdc(20000000));
    charlie = setupActor("charlie", cusd(1000), usdc(1000));
    david = setupActor("david", cusd(1000), usdc(1000));

    changePrank(governance);
    // pool.setAdminFee(5000000000);
  }

  function test_depositSwapDeposit() public {
    deposit(alice, amounts(cusd(5000000), usdc(5000000)));
    logPoolBalances();

    sell_cUSD(bob, cusd(5000000));
    logPoolBalances();

    deposit(alice, amounts(cusd(5000000), usdc(5000000)));
    logPoolBalances();

    sell_cUSD(bob, cusd(5000000));
    logActorBalances(bob);
    logPoolBalances();

    deposit(alice, amounts(cusd(5000000), usdc(5000000)));

    sell_cUSD(bob, cusd(5000000));
    logActorBalances(bob);
    logPoolBalances();

    deposit(alice, amounts(cusd(5000000), usdc(5000000)));

    sell_cUSD(bob, cusd(5000000));
    logActorBalances(bob);
    logPoolBalances();

    withdrawAll(alice);
  }

  function deposit(address actor, uint256[] memory amounts) internal {
    changePrank(actor);
    console.log(actors[actor], "deposit cUSD: ", amounts[0] / cusd(1));
    console.log(actors[actor], "deposit USDC: ", amounts[1] / usdc(1));
    uint256 lpTokens = pool.addLiquidity(amounts, 0, now + 1);
    console.log(actors[actor], "receives LP: ", lpTokens);
  }

  function withdrawAll(address actor) internal {
    changePrank(actor);
    logActorBalances(actor);
    console.log(actors[actor], "withdraws all liquidity");
    pool.removeLiquidity(lpToken.balanceOf(actor), amounts(0, 0), now + 1);
    logActorBalances(actor);
  }

  function logPoolBalances() internal view {
    uint256[] memory balances = pool.getBalances();
    console.log("-----------");
    console.log("Pool cUSD balance:", balances[0] / cusd(1));
    console.log("Pool USDC balance:", balances[1] / usdc(1));
  }

  function logActorBalances(address actor) internal view {
    console.log(actors[actor], "cUSD balance:", stableToken.balanceOf(actor) / cusd(1));
    console.log(actors[actor], "USDC balance:", IERC20(USDC).balanceOf(actor) / usdc(1));
  }

  function sell_cUSD(address actor, uint256 amount) internal {
    changePrank(actor);
    uint256 swapResult = pool.swap(0, 1, amount, 0, now + 1);
    console.log(actors[actor], "sells cUSD:", amount / cusd(1));
    console.log(actors[actor], "gets USDC:", swapResult / usdc(1));
  }

  function sell_USDC(address actor, uint256 amount) internal {
    changePrank(actor);
    uint256 swapResult = pool.swap(1, 0, amount, 0, now + 1);
    console.log(actors[actor], "sells USDC:", amount / usdc(1));
    console.log(actors[actor], "gets cUSD:", swapResult / cusd(1));
  }

  function usdc(uint256 amount) internal pure returns (uint256) {
    return amount * 10**6;
  }

  function cusd(uint256 amount) internal pure returns (uint256) {
    return amount * 10**18;
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
    actors[addr] = name;
    mint(stableToken, addr, cUSD_balance);
    deal(USDC, addr, USDC_balance);
    deal(addr, 1000_000000000000000000);

    changePrank(addr);
    IERC20(USDC).approve(MOBIUS_POOL, uint256(-1));
    lpToken.approve(MOBIUS_POOL, uint256(-1));
    stableToken.approve(MOBIUS_POOL, uint256(-1));
    changePrank(address(this));
    return addr;
  }

}
