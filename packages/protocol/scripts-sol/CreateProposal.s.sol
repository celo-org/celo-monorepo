// SPDX-License-Identifier: MIT
pragma solidity ^0.5.13;

import "forge-std/Script.sol";

import "../test-sol/utils/WithRegistry.sol";

import "contracts/governance/Governance.sol";
import "contracts/common/Proxy.sol";
import "contracts/governance/Proposals.sol";
import "contracts/stability/StableTokenMintableByOwner.sol";

contract DeploySTMBO is Script, WithRegistry {
  StableTokenMintableByOwner stableTokenMintableByOwner;
  address payable stableTokenProxyAddress;
  address stableTokenImplementationAddress;
  address constant USDC = 0x37f750B7cC259A2f741AF45294f6a16572CF5cAd;
  address constant StableTokenMintableByOwnerAddr = 0x41a2887d4C4D96C9E1a3505CF4553Fd0b1380F13;
  // address constant MOBIUS_POOL = 0xC0BA93D4aaf90d39924402162EE4a213300d1d60;
  address constant MOBIUS_POOL = 0xb88d9a72b192C4b5C043EDA1E152a0BeC2f94212;
  uint256 constant amountToDeposit_cUSD = 5_000_000_000_000_000_000_000_000;
  uint256 constant amountToDeposit_USDC = 5_000_000_000_000;
  address governanceAddr;
  address poolLpToken;
  Governance governance;

  constructor() public WithRegistry(true) {
    governanceAddr = registry.getAddressForString("Governance");
    stableTokenMintableByOwner = StableTokenMintableByOwner(StableTokenMintableByOwnerAddr);
    stableTokenProxyAddress = address(uint160(registry.getAddressForString("StableToken")));
    stableTokenImplementationAddress = Proxy(stableTokenProxyAddress)._getImplementation();
    governance = Governance(address(uint160(governanceAddr)));
  }

  function run() external {
    vm.startBroadcast();
    deal(USDC, governanceAddr, amountToDeposit_USDC * 2);
    createProposal(mintAndAddLiquidity_bothSides(), "mint-and-add-liquidity");
    vm.stopBroadcast();
  }

  function createProposal(Proposals.Transaction[] memory transactions, string memory id)
    internal
    returns (uint256)
  {
    (uint256[] memory values, address[] memory destinations, bytes memory data, uint256[] memory dataLengths) = serializeTransactions(
      transactions
    );

    deal(address(this), governance.minDeposit());
    (bool success, bytes memory returnData) = address(governance).call.value(
      governance.minDeposit()
    )(
      abi.encodeWithSignature(
        "propose(uint256[],address[],bytes,uint256[],string)",
        values,
        destinations,
        data,
        dataLengths,
        id
      )
    );

    if (success == false) {
      console.logBytes(returnData);
    }
    require(success);
    return abi.decode(returnData, (uint256));
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
      abi.encodeWithSignature("addLiquidity(uint256[],uint256,uint256)", amounts, 0, now + 1000000)
    );
  }

  function serializeTransactions(Proposals.Transaction[] memory transactions)
    internal
    pure
    returns (
      uint256[] memory values,
      address[] memory destinations,
      bytes memory data,
      uint256[] memory dataLengths
    )
  {
    values = new uint256[](transactions.length);
    destinations = new address[](transactions.length);
    dataLengths = new uint256[](transactions.length);

    for (uint256 i = 0; i < transactions.length; i++) {
      values[i] = transactions[i].value;
      destinations[i] = transactions[i].destination;
      data = abi.encodePacked(data, transactions[i].data);
      dataLengths[i] = transactions[i].data.length;
    }
  }

}
