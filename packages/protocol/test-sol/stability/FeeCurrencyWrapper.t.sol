// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import "celo-foundry-8/Test.sol";

import "@celo-contracts/common/FixidityLib.sol";

import "@celo-contracts/common/interfaces/IRegistry.sol";

// Contract to test
import "@celo-contracts-8/stability/FeeCurrencyWrapper.sol";
import "@celo-contracts-8/stability/IFeeCurrency.sol";
import "@openzeppelin/contracts8/token/ERC20/ERC20.sol";
import "forge-std/console.sol";

contract FeeCurrency6DecimalsTest is ERC20, IFeeCurrency {
  constructor(uint256 initialSupply) ERC20("ExampleFeeCurrency", "EFC") {
    _mint(msg.sender, initialSupply);
  }

  function debitGasFees(address from, uint256 value) external {
    _burn(from, value);
  }

  // New function signature, will be used when all fee currencies have migrated
  function creditGasFees(address[] calldata recipients, uint256[] calldata amounts) public {
    require(recipients.length == amounts.length, "Recipients and amounts must be the same length.");

    for (uint256 i = 0; i < recipients.length; i++) {
      _mint(recipients[i], amounts[i]);
    }
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
    // Calling the new creditGasFees would make sense here, but that is not
    // possible due to its calldata arguments.
    _mint(from, refund);
    _mint(feeRecipient, tipTxFee);
    _mint(communityFund, baseTxFee);
  }

  function decimals() public pure override returns (uint8) {
    return 6;
  }
}

contract FeeCurrencyWrapperTestContract is FeeCurrencyWrapper {
  constructor(bool test) FeeCurrencyWrapper(test) {}

 function upscaleVisible(uint256 value) external view returns (uint256) {
    return upscale(value);
  }

  function downscaleVisible(uint256 value) external view returns (uint256) {
    return downscale(value);
  }
}

contract FeeCurrencyWrapperTest is Test {
  using FixidityLib for FixidityLib.Fraction;

  FeeCurrencyWrapperTestContract public feeCurrencyWrapper;
  address owner;
  address nonOwner;
  IFeeCurrency feeCurrency;

  uint256 initialSupply = 10_000;

  function setUp() public virtual {
    owner = address(this);
    nonOwner = actor("nonOwner");

    feeCurrencyWrapper = new FeeCurrencyWrapperTestContract(true);
    address feeCurrencyAddress = actor("feeCurrency");

    string memory name = "tokenName";
    string memory symbol = "tN";

    deployCodeTo(
      "CeloERC20.sol:FiatTokenCeloV2_2",
      abi.encode(name, symbol, initialSupply),
      feeCurrencyAddress
    );
    feeCurrency = IFeeCurrency(feeCurrencyAddress);

    feeCurrencyWrapper.initialize(address(feeCurrency), "wrapper", "wr", 18);
  }
}

contract ERC20TokenWrapperTest_Initialize is FeeCurrencyWrapperTest {
  function test_ShouldSetDigitDifference() public {
    assertEq(feeCurrencyWrapper.digitDifference(), 10**12);
  }

  function test_shouldRevertWhenCalledAgain() public {
    vm.expectRevert("contract already initialized");
    feeCurrencyWrapper.initialize(address(feeCurrency), "wrapper", "wr", 18);
  }
}

contract ERC20TokenWrapperTest_BalanceOf is FeeCurrencyWrapperTest {
  function test_shouldReturnBalanceOf() public {
    assertEq(feeCurrency.balanceOf(address(this)), initialSupply);
    assertEq(feeCurrencyWrapper.balanceOf(address(this)), initialSupply * 1e12);
  }
}

contract ERC20TokenWrapperTest_DebitGasFees is FeeCurrencyWrapperTest {
  function test_shouldDebitGasFees() public {
    uint256 amount = 1000 * 1e12;
    vm.prank(address(0));
    feeCurrencyWrapper.debitGasFees(address(this), amount);
    assertEq(feeCurrency.balanceOf(address(this)), initialSupply - amount / 1e12);
    assertEq(feeCurrencyWrapper.balanceOf(address(this)), (initialSupply * 1e12 - amount));
    assertEq(feeCurrencyWrapper.debited(), amount / 1e12);
  }

  function test_shouldRevert_WhenNotCalledByVm() public {
    vm.expectRevert("Only VM can call");
    feeCurrencyWrapper.debitGasFees(address(this), 1000);
  }

}

contract ERC20TokenWrapperTest_CreditGasFees is FeeCurrencyWrapperTest {
  function test_shouldCreditGasFees() public {
    uint256 amount = 1000 * 1e12;
    vm.prank(address(0));
    feeCurrencyWrapper.debitGasFees(address(this), amount);

    vm.prank(address(0));
    feeCurrencyWrapper.creditGasFees(
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
    assertEq(feeCurrencyWrapper.balanceOf(address(this)), initialSupply * 1e12);
  }

  function test_shouldRevert_WhenTryingToCreditMoreThanBurned() public {
    uint256 amount = 1 * 1e12;
    vm.prank(address(0));
    feeCurrencyWrapper.debitGasFees(address(this), amount);

    vm.expectRevert("Cannot credit more than debited.");
    vm.prank(address(0));
    feeCurrencyWrapper.creditGasFees(
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
    feeCurrencyWrapper.creditGasFees(
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
    vm.prank(address(0));
    feeCurrencyWrapper.creditGasFees(new address[](1), new uint256[](2));
  }

  function test_shouldRevert_WhenRecipientsAndAmountsAreDifferentLengths_New() public {
    uint256 amount = 1000 * 1e12;
    vm.prank(address(0));
    feeCurrencyWrapper.debitGasFees(address(this), amount);
    
    vm.prank(address(0));
    vm.expectRevert("Recipients and amounts must be the same length.");
    feeCurrencyWrapper.creditGasFees(new address[](1), new uint256[](2));
  }

  function test_shouldRevert_WhenNotCalledByVm_New() public {
    vm.expectRevert("Only VM can call");
    feeCurrencyWrapper.creditGasFees(new address[](1), new uint256[](2));
  }

  function test_shouldRevert_WhenTryingToCreditMoreThanBurned_New() public {
    uint256 amount = 1 * 1e12;
    vm.prank(address(0));
    feeCurrencyWrapper.debitGasFees(address(this), amount);

    vm.expectRevert("Cannot credit more than debited.");
    vm.prank(address(0));
    address[] memory recipients = new address[](2);
    recipients[0] = address(this);
    recipients[1] = address(this);
    uint256[] memory amounts = new uint256[](2);
    amounts[0] = 1 ether;
    amounts[1] = 1 ether;

    feeCurrencyWrapper.creditGasFees(recipients, amounts);
  }

}

contract ERC20TokenWrapperTest_UpscaleAndDownScaleTests is FeeCurrencyWrapperTest {
  function test_shouldUpscale() public {
    assertEq(feeCurrencyWrapper.upscaleVisible(1), 1e12);
    assertEq(feeCurrencyWrapper.upscaleVisible(1e6), 1e18);
    assertEq(feeCurrencyWrapper.upscaleVisible(1e12), 1e24);
  }

function test_ShouldRevertUpscale_WhenOverflow() public {
    uint256 digitDifference = 10**12;
    uint256 maxValue = type(uint256).max;
    uint256 boundaryValue = maxValue / digitDifference + 1;

    vm.expectRevert();
    feeCurrencyWrapper.upscaleVisible(boundaryValue);
}

  function test_shouldDownscale() public {
    assertEq(feeCurrencyWrapper.downscaleVisible(1e12), 1);
    assertEq(feeCurrencyWrapper.downscaleVisible(1e18), 1e6);
    assertEq(feeCurrencyWrapper.downscaleVisible(1e24), 1e12);
  }

  function test_ShouldReturn0_WhenSmallEnough() public {
    assertEq(feeCurrencyWrapper.downscaleVisible(1), 0);
    assertEq(feeCurrencyWrapper.downscaleVisible(1e6 - 1), 0);
    assertEq(feeCurrencyWrapper.downscaleVisible(1e12 - 1), 0);
  }
}