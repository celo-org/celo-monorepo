// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;

import "celo-foundry/Test.sol";
import "@celo-contracts/common/GoldToken.sol";
import "@celo-contracts/common/test/MockGoldToken.sol";
import "forge-std/console.sol";
import "@celo-contracts/common/interfaces/IRegistry.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "../contracts/common/FixidityLib.sol";

interface TetherToken {
  function mint(address _destination, uint256 _amount) external;
}

interface IFeeCurrencyAdapter {
  function getAdaptedToken() external view returns (address);

  function digitDifference() external view returns (uint96);

  function debited() external view returns (uint256);

  function name() external view returns (string memory);

  function symbol() external view returns (string memory);

  function expectedDecimals() external view returns (uint8);

  function decimals() external view returns (uint8);

  function debitGasFees(address from, uint256 value) external;

  function creditGasFees(
    address refundRecipient,
    address tipRecipient,
    address _gatewayFeeRecipient,
    address baseFeeRecipient,
    uint256 refundAmount,
    uint256 tipAmount,
    uint256 _gatewayFeeAmount,
    uint256 baseFeeAmount
  ) external;
}

contract TetherTestTest is Test {
  address constant registryAddress = address(0x000000000000000000000000000000000000ce10);
  address account1 = actor("account1");
  address account2 = actor("account2");
  IRegistry registry = IRegistry(registryAddress);

  address tetherOwner = address(0x00ba2a995bd4ab9e605454ccef88169352cd5f75a6);
  address ourTestAddress = address(0x80c9945818419d42c4f9418e1B9dE9864b6419BD);
  address tetherContract = address(0x0048065fbBE25f71C9282ddf5e1cD6D6A887483D5e);
  address tipRecipent = address(0x1);
  address feeHandler = address(0x1);
  address tetherAdapterAddress = address(0x0E2A3e05bc9A16F5292A6170456A710cb89C6f72);

  function test_transfer() public {
    // placeholder to make sure we're working on Celo network
    GoldToken goldToken = GoldToken(registry.getAddressForStringOrDie("GoldToken"));
    vm.deal(account1, 1 wei);
    vm.prank(account1);
    goldToken.transfer(account1, 1);
    assertEq(goldToken.balanceOf(account1), 1);
  }

  function test_e2e() public {
    IFeeCurrencyAdapter adapter = IFeeCurrencyAdapter(tetherAdapterAddress);
    IERC20 erc20TetherToken = IERC20(tetherContract);

    vm.prank(tetherOwner);
    TetherToken(tetherContract).mint(ourTestAddress, 10e6);

    address refundRecipient = ourTestAddress;
    address tipRecipient = tipRecipent;
    address _gatewayFeeRecipient = address(0x0);
    address baseFeeRecipient = feeHandler;
    uint256 refundAmount = 0.2e18;
    uint256 tipAmount = 0.2e18;
    uint256 _gatewayFeeAmount = 0;
    uint256 baseFeeAmount = 0.6e18;

    vm.startPrank(address(0x0));

    adapter.debitGasFees(ourTestAddress, 1e18);

    adapter.creditGasFees(
      refundRecipient,
      tipRecipient,
      _gatewayFeeRecipient,
      baseFeeRecipient,
      refundAmount,
      tipAmount,
      _gatewayFeeAmount,
      baseFeeAmount
    );

    assertEq(erc20TetherToken.balanceOf(ourTestAddress), 10e6 - 0.8e6);

    // do it again to make sure debited is 0
    adapter.debitGasFees(ourTestAddress, 1e18);
    adapter.creditGasFees(
      refundRecipient,
      tipRecipient,
      _gatewayFeeRecipient,
      baseFeeRecipient,
      refundAmount,
      tipAmount,
      _gatewayFeeAmount,
      baseFeeAmount
    );

    assertEq(erc20TetherToken.balanceOf(ourTestAddress), 10e6 - ((0.8e6) * 2));

  }
}

contract FeeCurrencyAdapterTest is TetherTestTest {
  using FixidityLib for FixidityLib.Fraction;

  event GasFeesDebited(address indexed debitedFrom, uint256 debitedAmount);

  event GasFeesCredited(
    address indexed refundRecipient,
    address indexed tipRecipient,
    address indexed baseFeeRecipient,
    uint256 refundAmount,
    uint256 tipAmount,
    uint256 baseFeeAmount
  );

  IFeeCurrencyAdapter feeCurrencyAdapter = IFeeCurrencyAdapter(tetherAdapterAddress);
  IERC20 feeCurrency = IERC20(tetherContract);

  address owner;
  address nonOwner;

  uint256 initialSupply = 10_000;

  function setUp() public {
    owner = address(this);
    nonOwner = actor("nonOwner");

    vm.prank(tetherOwner);
    TetherToken(tetherContract).mint(address(this), 10_000);
  }
}

contract FeeCurrencyAdapter_Decimals is FeeCurrencyAdapterTest {
  function test_shouldReturnDecimals() public {
    assertEq(uint256(feeCurrencyAdapter.decimals()), 18);
  }
}

contract FeeCurrencyAdapter_DebitGasFees is FeeCurrencyAdapterTest {
  function test_shouldDebitGasFees() public {
    uint256 amount = 1000 * 1e12;
    vm.prank(address(0));
    feeCurrencyAdapter.debitGasFees(address(this), amount);
    assertEq(feeCurrency.balanceOf(address(this)), initialSupply - amount / 1e12);
    assertEq(feeCurrencyAdapter.debited(), amount / 1e12);
  }

  function test_shouldRevert_WhenNotCalledByVm() public {
    vm.expectRevert("Only VM can call");
    feeCurrencyAdapter.debitGasFees(address(this), 1000);
  }

  function test_ShouldRevert_WhenScaledDebitValueIs0() public {
    vm.expectRevert("Can not debit 0");
    vm.prank(address(0));
    feeCurrencyAdapter.debitGasFees(address(this), 1e7);
  }
}

contract FeeCurrencyAdapter_CreditGasFees is FeeCurrencyAdapterTest {
  function test_shouldCreditGasFees() public {
    uint256 amount = 1000 * 1e12;
    vm.prank(address(0));
    feeCurrencyAdapter.debitGasFees(address(this), amount);

    vm.prank(address(0));
    feeCurrencyAdapter.creditGasFees(
      address(this),
      address(this),
      address(0),
      address(this),
      amount / 4,
      amount / 4,
      0,
      amount / 4
    );
    assertEq(feeCurrency.balanceOf(address(this)), initialSupply);
  }

  function test_shouldRevert_WhenTryingToCreditMoreThanBurned() public {
    uint256 amount = 1 * 1e12;
    vm.prank(address(0));
    feeCurrencyAdapter.debitGasFees(address(this), amount);

    vm.expectRevert("Can not credit more than debited");
    vm.prank(address(0));
    feeCurrencyAdapter.creditGasFees(
      address(this),
      address(this),
      address(this),
      address(this),
      1 ether,
      1 ether,
      1 ether,
      1 ether
    );
  }

  function test_shouldRevert_WhenNotCalledByVm() public {
    vm.expectRevert("Only VM can call");
    feeCurrencyAdapter.creditGasFees(
      address(this),
      address(this),
      address(this),
      address(this),
      1000,
      1000,
      1000,
      1000
    );
  }

  function test_shouldNotRunFunctionBody_WhenDebitedIs0() public {
    uint256 balanceBefore = feeCurrency.balanceOf(address(this));
    vm.prank(address(0));
    feeCurrencyAdapter.creditGasFees(
      address(this),
      address(this),
      address(this),
      address(this),
      1000,
      1000,
      1000,
      1000
    );
    uint256 balanceAfter = feeCurrency.balanceOf(address(this));
    assertEq(balanceBefore, balanceAfter);
  }
}
