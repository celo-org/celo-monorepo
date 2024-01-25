// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <=0.8.20;

import "celo-foundry-8/Test.sol";

import "../../contracts/common/FixidityLib.sol";
import "../../contracts/common/interfaces/IRegistry.sol";

// Contract to test
import "@celo-contracts-8/stability/FeeCurrencyAdapter.sol";
import "@celo-contracts-8/stability/interfaces/IFeeCurrency.sol";
import "@openzeppelin/contracts8/token/ERC20/ERC20.sol";
import "forge-std/console.sol";

contract FeeCurrency6DecimalsTest is ERC20, IFeeCurrency {
  uint256 debited;

  constructor(uint256 initialSupply) ERC20("ExampleFeeCurrency", "EFC") {
    _mint(msg.sender, initialSupply);
  }

  function debitGasFees(address from, uint256 value) external {
    _burn(from, value);
    debited = value;
  }

  // New function signature, will be used when all fee currencies have migrated
  function creditGasFees(address[] calldata recipients, uint256[] calldata amounts) public {
    require(recipients.length == amounts.length, "Recipients and amounts must be the same length.");

    uint256 totalSum = 0;

    for (uint256 i = 0; i < recipients.length; i++) {
      _mint(recipients[i], amounts[i]);
      totalSum += amounts[i];
    }

    require(debited == totalSum, "Cannot credit more than debited.");
    debited = 0;
  }

  // Old function signature for backwards compatibility
  function creditGasFees(
    address from,
    address feeRecipient,
    address, // gatewayFeeRecipient, unused
    address communityFund,
    uint256 refund,
    uint256 tipTxFee,
    uint256, // gatewayFee, unused
    uint256 baseTxFee
  ) public {
    require(debited == refund + tipTxFee + baseTxFee, "Cannot credit more than debited.");
    // Calling the new creditGasFees would make sense here, but that is not
    // possible due to its calldata arguments.
    _mint(from, refund);
    _mint(feeRecipient, tipTxFee);
    _mint(communityFund, baseTxFee);

    debited = 0;
  }

  function decimals() public pure override returns (uint8) {
    return 6;
  }
}

contract FeeCurrencyAdapterTestContract is FeeCurrencyAdapter {
  constructor(bool test) FeeCurrencyAdapter(test) {}

  function upscaleVisible(uint256 value) external view returns (uint256) {
    return upscale(value);
  }

  function downscaleVisible(uint256 value) external view returns (uint256) {
    return downscale(value);
  }
}

contract FeeCurrencyAdapterTest is Test {
  using FixidityLib for FixidityLib.Fraction;

  FeeCurrencyAdapterTestContract public FeeCurrencyAdapter;
  address owner;
  address nonOwner;
  IFeeCurrency feeCurrency;

  uint256 initialSupply = 10_000;

  function setUp() public virtual {
    owner = address(this);
    nonOwner = actor("nonOwner");

    FeeCurrencyAdapter = new FeeCurrencyAdapterTestContract(true);
    address feeCurrencyAddress = actor("feeCurrency");

    string memory name = "tokenName";
    string memory symbol = "tN";

    feeCurrency = new FeeCurrency6DecimalsTest(initialSupply);

    FeeCurrencyAdapter.initialize(address(feeCurrency), "wrapper", "wr", 18);
  }
}

contract FeeCurrencyAdapter_Initialize is FeeCurrencyAdapterTest {
  function test_ShouldSetDigitDifference() public {
    assertEq(FeeCurrencyAdapter.digitDifference(), 10**12);
  }

  function test_shouldRevertWhenCalledAgain() public {
    vm.expectRevert("contract already initialized");
    FeeCurrencyAdapter.initialize(address(feeCurrency), "wrapper", "wr", 18);
  }
}

contract FeeCurrencyAdapter_BalanceOf is FeeCurrencyAdapterTest {
  function test_shouldReturnBalanceOf() public {
    assertEq(feeCurrency.balanceOf(address(this)), initialSupply);
    assertEq(FeeCurrencyAdapter.balanceOf(address(this)), initialSupply * 1e12);
  }
}

contract FeeCurrencyAdapter_DebitGasFees is FeeCurrencyAdapterTest {
  function test_shouldDebitGasFees() public {
    uint256 amount = 1000 * 1e12;
    vm.prank(address(0));
    FeeCurrencyAdapter.debitGasFees(address(this), amount);
    assertEq(feeCurrency.balanceOf(address(this)), initialSupply - amount / 1e12);
    assertEq(FeeCurrencyAdapter.balanceOf(address(this)), (initialSupply * 1e12 - amount));
    assertEq(FeeCurrencyAdapter.debited(), amount / 1e12);
  }

  function test_shouldRevert_WhenNotCalledByVm() public {
    vm.expectRevert("Only VM can call");
    FeeCurrencyAdapter.debitGasFees(address(this), 1000);
  }

}

contract FeeCurrencyAdapter_CreditGasFees is FeeCurrencyAdapterTest {
  function test_shouldCreditGasFees() public {
    uint256 amount = 1000 * 1e12;
    vm.prank(address(0));
    FeeCurrencyAdapter.debitGasFees(address(this), amount);

    vm.prank(address(0));
    FeeCurrencyAdapter.creditGasFees(
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
    assertEq(FeeCurrencyAdapter.balanceOf(address(this)), initialSupply * 1e12);
  }

  function test_shouldRevert_WhenTryingToCreditMoreThanBurned() public {
    uint256 amount = 1 * 1e12;
    vm.prank(address(0));
    FeeCurrencyAdapter.debitGasFees(address(this), amount);

    vm.expectRevert("Cannot credit more than debited.");
    vm.prank(address(0));
    FeeCurrencyAdapter.creditGasFees(
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
    FeeCurrencyAdapter.creditGasFees(
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
    FeeCurrencyAdapter.creditGasFees(
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

contract FeeCurrencyAdapter_UpscaleAndDownScaleTests is FeeCurrencyAdapterTest {
  function test_shouldUpscale() public {
    assertEq(FeeCurrencyAdapter.upscaleVisible(1), 1e12);
    assertEq(FeeCurrencyAdapter.upscaleVisible(1e6), 1e18);
    assertEq(FeeCurrencyAdapter.upscaleVisible(1e12), 1e24);
  }

  function test_ShouldRevertUpscale_WhenOverflow() public {
    uint256 digitDifference = 10**12;
    uint256 maxValue = type(uint256).max;
    uint256 boundaryValue = maxValue / digitDifference + 1;

    vm.expectRevert();
    FeeCurrencyAdapter.upscaleVisible(boundaryValue);
  }

  function test_shouldDownscale() public {
    assertEq(FeeCurrencyAdapter.downscaleVisible(1e12), 1);
    assertEq(FeeCurrencyAdapter.downscaleVisible(1e18), 1e6);
    assertEq(FeeCurrencyAdapter.downscaleVisible(1e24), 1e12);
  }

  function test_ShouldReturn0_WhenSmallEnough() public {
    assertEq(FeeCurrencyAdapter.downscaleVisible(1), 0);
    assertEq(FeeCurrencyAdapter.downscaleVisible(1e6 - 1), 0);
    assertEq(FeeCurrencyAdapter.downscaleVisible(1e12 - 1), 0);
  }
}

contract FeeCurrencyAdapter_SetWrappedToken is FeeCurrencyAdapterTest {
  function test_shouldRevert_WhenNotCalledByOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(nonOwner);
    FeeCurrencyAdapter.setWrappedToken(address(0));
  }

  function test_shouldSetWrappedToken() public {
    address newWrappedToken = actor("newWrappedToken");
    FeeCurrencyAdapter.setWrappedToken(newWrappedToken);
    assertEq(address(FeeCurrencyAdapter.wrappedToken()), newWrappedToken);
    assertEq(FeeCurrencyAdapter.getWrappedToken(), newWrappedToken);
  }
}
