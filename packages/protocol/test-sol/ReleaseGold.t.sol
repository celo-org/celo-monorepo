// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import "celo-foundry/Test.sol";
import "forge-std/console.sol";
import "../contracts/identity/Escrow.sol";
import "../contracts/identity/FederatedAttestations.sol";
import "../contracts/identity/test/MockAttestations.sol";
import "../contracts/identity/test/MockERC20Token.sol";
import "../contracts/common/FixidityLib.sol";

import "../contracts/common/Registry.sol";
import "../contracts/common/Accounts.sol";
import "../contracts/common/Freezer.sol";
import "../contracts/common/GoldToken.sol";
import "../contracts/governance/LockedGold.sol";
import "../contracts/governance/ReleaseGold.sol";
import "../contracts/stability/test/MockStableToken.sol";
import "../contracts/governance/test/MockElection.sol";
import "../contracts/governance/test/MockGovernance.sol";
import "../contracts/governance/test/MockValidators.sol";

interface ISECP256K1 {
  function recover(uint256 digest, uint8 v, uint256 r, uint256 s)
    external
    pure
    returns (uint256, uint256);
}

contract ReleaseGoldTest is Test {
  using FixidityLib for FixidityLib.Fraction;

  Registry registry;
  Accounts accounts;
  Freezer freezer;
  GoldToken goldToken;
  MockStableToken stableToken;
  MockElection election;
  MockGovernance governance;
  MockValidators validators;
  LockedGold lockedGold;
  ReleaseGold releaseGold;

  event ReleaseGoldInstanceCreated(address indexed beneficiary, address indexed atAddress);
  event ReleaseScheduleRevoked(uint256 revokeTimestamp, uint256 releasedBalanceAtRevoke);
  event ReleaseGoldInstanceDestroyed(address indexed beneficiary, address indexed atAddress);
  event DistributionLimitSet(address indexed beneficiary, uint256 maxDistribution);
  event LiquidityProvisionSet(address indexed beneficiary);
  event CanExpireSet(bool canExpire);
  event BeneficiarySet(address indexed beneficiary);

  address owner = address(this);
  address beneficiary;
  uint256 beneficiaryPrivateKey;
  address walletAddress = beneficiary;
  address releaseOwner = actor("releaseOwner");
  address refundAddress = actor("refundAddress");
  address newBeneficiary = actor("newBeneficiary");
  address randomAddress = actor("randomAddress");

  uint256 constant TOTAL_AMOUNT = 1 ether * 10;

  uint256 constant MINUTE = 60;
  uint256 constant HOUR = 60 * 60;
  uint256 constant DAY = 24 * HOUR;
  uint256 constant MONTH = 30 * DAY;
  uint256 constant UNLOCKING_PERIOD = 3 * DAY;

  ReleaseGold.ReleaseGoldConfig config;

  function newReleaseGold(bool prefund, bool startReleasing) internal returns (ReleaseGold) {
    if (prefund) {
      goldToken.transfer(
        address(releaseGold),
        config.amountReleasedPerPeriod * config.numReleasePeriods
      );
    }

    releaseGold.initialize(config);

    if (startReleasing) {
      vm.warp(block.timestamp + config.releaseCliffTime + config.releasePeriod + 1);
    }
  }

  function getParsedSignatureOfAddress(address _address, uint256 privateKey)
    public
    pure
    returns (uint8, bytes32, bytes32)
  {
    bytes32 addressHash = keccak256(abi.encodePacked(_address));
    bytes32 prefixedHash = ECDSA.toEthSignedMessageHash(addressHash);
    return vm.sign(privateKey, prefixedHash);
  }

  function setUp() public {
    (beneficiary, beneficiaryPrivateKey) = actorWithPK("beneficiary");
    walletAddress = beneficiary;

    address registryAddress = 0x000000000000000000000000000000000000ce10;
    deployCodeTo("Registry.sol", abi.encode(false), registryAddress);
    registry = Registry(registryAddress);

    accounts = new Accounts(true);
    freezer = new Freezer(true);
    goldToken = new GoldToken(true);
    lockedGold = new LockedGold(true);
    election = new MockElection();
    governance = new MockGovernance();
    validators = new MockValidators();
    stableToken = new MockStableToken();
    releaseGold = new ReleaseGold(true);

    registry.setAddressFor("Accounts", address(accounts));
    registry.setAddressFor("Election", address(election));
    registry.setAddressFor("Freezer", address(freezer));
    registry.setAddressFor("GoldToken", address(goldToken));
    registry.setAddressFor("Governance", address(governance));
    registry.setAddressFor("LockedGold", address(lockedGold));
    registry.setAddressFor("Validators", address(validators));
    registry.setAddressFor("StableToken", address(stableToken));

    lockedGold.initialize(registryAddress, UNLOCKING_PERIOD);
    goldToken.initialize(registryAddress);
    accounts.initialize(registryAddress);
    vm.prank(beneficiary);
    accounts.createAccount();

    config = ReleaseGold.ReleaseGoldConfig({
      releaseStartTime: block.timestamp + 5 * MINUTE,
      releaseCliffTime: HOUR,
      numReleasePeriods: 4,
      releasePeriod: 3 * MONTH,
      amountReleasedPerPeriod: TOTAL_AMOUNT / 4,
      revocable: true,
      beneficiary: address(uint160(beneficiary)),
      releaseOwner: releaseOwner,
      refundAddress: address(uint160(refundAddress)),
      subjectToLiquidityProvision: false,
      initialDistributionRatio: 1000,
      canValidate: false,
      canVote: true,
      registryAddress: registryAddress
    });

    vm.deal(randomAddress, 1000 ether);
  }
}

contract Initialize is ReleaseGoldTest {
  function setUp() public {
    super.setUp();
  }

  function test_ShouldIndicateIsFundedIfDeploymentIsPrefunded() public {
    newReleaseGold(true, false);
    assertTrue(releaseGold.isFunded());
  }

  function test_ShouldNotIndicateFundedAndNotRevertIfDeploymentIsNotPrefunded() public {
    newReleaseGold(false, false);
    assertFalse(releaseGold.isFunded());
  }
}

contract Payable is ReleaseGoldTest {
  function setUp() public {
    super.setUp();
  }

  function test_ShouldAcceptGoldTransferByDefaultFromAnyone() public {
    newReleaseGold(true, false);
    vm.prank(randomAddress);
    goldToken.transfer(address(releaseGold), 2 ether);
  }

  function test_ShouldNotUpdateIsFundedIfSchedulePrincipleNotFulfilled() public {
    newReleaseGold(false, false);
    uint256 insufficientPrinciple = config.amountReleasedPerPeriod * config.numReleasePeriods - 1;
    goldToken.transfer(address(releaseGold), insufficientPrinciple);
    assertFalse(releaseGold.isFunded());
  }

  function test_ShouldUpdateIsFundedIfSchedulePrincipleIsFulfilledAfterDeploy() public {
    newReleaseGold(false, false);
    uint256 sufficientPrinciple = config.amountReleasedPerPeriod * config.numReleasePeriods;
    goldToken.transfer(address(releaseGold), sufficientPrinciple);
    assertTrue(releaseGold.isFunded());
  }

  function test_ShouldUpdateIsFundedIfSchedulePrincipleNotFulfilledButHasBegunReleasing() public {
    newReleaseGold(false, true);
    uint256 insufficientPrinciple = config.amountReleasedPerPeriod * config.numReleasePeriods - 1;
    goldToken.transfer(address(releaseGold), insufficientPrinciple);
    assertTrue(releaseGold.isFunded());
  }
}

contract Transfer is ReleaseGoldTest {
  address receiver = actor("receiver");
  uint256 transferAmount = 10;

  function setUp() public {
    super.setUp();
    newReleaseGold(true, false);
    stableToken.mint(address(releaseGold), transferAmount);
  }

  function test_ShouldTransferStableTokenFromTheReleaseGoldInstance() public {
    vm.prank(beneficiary);
    releaseGold.transfer(receiver, transferAmount);
    assertEq(stableToken.balanceOf(address(releaseGold)), 0);
    assertEq(stableToken.balanceOf(receiver), transferAmount);
  }

}

contract GenericTransfer is ReleaseGoldTest {
  address receiver = actor("receiver");
  uint256 transferAmount = 10;

  function setUp() public {
    super.setUp();
    newReleaseGold(true, false);
    stableToken.mint(address(releaseGold), transferAmount);
  }

  function test_ShouldTransferStableTokenFromTheReleaseGoldInstance() public {
    uint256 startBalanceFrom = stableToken.balanceOf(address(releaseGold));
    uint256 startBalanceTo = stableToken.balanceOf(receiver);
    vm.prank(beneficiary);
    releaseGold.genericTransfer(address(stableToken), receiver, transferAmount);
    assertEq(stableToken.balanceOf(address(releaseGold)), startBalanceFrom - transferAmount);
    assertEq(stableToken.balanceOf(receiver), startBalanceTo + transferAmount);
  }

  function test_ShouldEmitSafeTransferLogsOnErc20Revert() public {
    uint256 startBalanceFrom = stableToken.balanceOf(address(releaseGold));
    vm.expectRevert("SafeERC20: ERC20 operation did not succeed");
    vm.prank(beneficiary);
    releaseGold.genericTransfer(address(stableToken), receiver, startBalanceFrom + 1);
  }

  function test_ShouldRevertWhenAttemptingTransferOfGoldTokenFromTheReleaseGoldInstance() public {
    vm.expectRevert("Transfer must not target celo balance");
    vm.prank(beneficiary);
    releaseGold.genericTransfer(address(goldToken), receiver, transferAmount);
  }

}

contract Creation is ReleaseGoldTest {
  uint256 public maxUint256 = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;

  function setUp() public {
    super.setUp();
  }

  function test_ShouldHaveAssociatedFundsWithAScheduleUponCreation() public {
    newReleaseGold(true, false);
    assertEq(
      goldToken.balanceOf(address(releaseGold)),
      config.numReleasePeriods * config.amountReleasedPerPeriod
    );
  }

  function test_ShouldSetABeneficiaryToReleaseGoldInstance() public {
    newReleaseGold(true, false);
    assertEq(releaseGold.beneficiary(), config.beneficiary);
  }

  function test_ShouldSetAReleaseOwnerToReleaseGoldInstance() public {
    newReleaseGold(true, false);
    assertEq(releaseGold.releaseOwner(), config.releaseOwner);
  }

  function test_ShouldSetReleaseGoldNUmberOfPeriods() public {
    newReleaseGold(true, false);
    (, , uint256 releaseGoldNumPeriods, , ) = releaseGold.releaseSchedule();
    assertEq(releaseGoldNumPeriods, config.numReleasePeriods);
  }

  function test_ShouldSetReleaseGoldAmountPerPeriod() public {
    newReleaseGold(true, false);
    (, , , , uint256 releaseGoldAmountPerPeriod) = releaseGold.releaseSchedule();
    assertEq(releaseGoldAmountPerPeriod, config.amountReleasedPerPeriod);
  }

  function test_ShouldSetReleaseGoldPeriod() public {
    newReleaseGold(true, false);
    (, , , uint256 releaseGoldPeriod, ) = releaseGold.releaseSchedule();
    assertEq(releaseGoldPeriod, config.releasePeriod);
  }

  function test_ShouldSetReleaseGoldStartTime() public {
    newReleaseGold(true, false);
    (uint256 releaseGoldStartTime, , , , ) = releaseGold.releaseSchedule();
    assertEq(releaseGoldStartTime, config.releaseStartTime);
  }

  function test_ShouldSetReleaseGoldCliffTime() public {
    newReleaseGold(true, false);
    (, uint256 releaseGoldCliffTime, , , ) = releaseGold.releaseSchedule();
    uint256 expectedCliffTime = config.releaseStartTime + config.releaseCliffTime;
    assertEq(releaseGoldCliffTime, expectedCliffTime);
  }

  function test_ShouldSetRevocableFlagToReleaseGoldInstance() public {
    newReleaseGold(true, false);
    (bool revocable, , , ) = releaseGold.revocationInfo();
    assertEq(revocable, config.revocable);
  }

  function test_ShouldSetReleaseOwnerToReleaseGoldInstance() public {
    newReleaseGold(true, false);
    assertEq(releaseGold.releaseOwner(), config.releaseOwner);
  }

  function test_ShouldSetLiquidityProvisionMetToTrue() public {
    newReleaseGold(true, false);
    assertEq(releaseGold.liquidityProvisionMet(), true);
  }

  function test_ShouldHaveZeroTotalWithdrawnOnInit() public {
    newReleaseGold(true, false);
    assertEq(releaseGold.totalWithdrawn(), 0);
  }

  function test_ShouldBeUnrevokedOnInitAndHaveRevokeTimeEqualZero() public {
    newReleaseGold(true, false);
    (, , , uint256 revokeTime) = releaseGold.revocationInfo();
    assertEq(revokeTime, 0);
    assertEq(releaseGold.isRevoked(), false);
  }

  function test_ShouldHaveReleaseGoldBalanceAtRevokeOnInitEqualToZero() public {
    newReleaseGold(true, false);
    (, , uint256 releasedBalanceAtRevoke, ) = releaseGold.revocationInfo();
    assertEq(releasedBalanceAtRevoke, 0);
  }

  function test_ShouldRevertWhenReleaseGoldBeneficiaryIsTheNullAddress() public {
    config.beneficiary = address(0);
    vm.expectRevert("The release schedule beneficiary cannot be the zero addresss");
    releaseGold.initialize(config);
  }

  function test_ShouldRevertWhenReleaseGoldPeriodsAreZero() public {
    config.numReleasePeriods = 0;
    vm.expectRevert("There must be at least one releasing period");
    releaseGold.initialize(config);
  }

  function test_ShouldRevertWhenReleasedAmountPerPeriodIsZero() public {
    config.amountReleasedPerPeriod = 0;
    vm.expectRevert("The released amount per period must be greater than zero");
    releaseGold.initialize(config);
  }

  function test_ShouldOverflowForVeryLargeCombinationsOdReleasePeriodsAndAmountPerTime() public {
    config.numReleasePeriods = maxUint256;
    config.amountReleasedPerPeriod = maxUint256;
    config.initialDistributionRatio = 999;
    vm.expectRevert("SafeMath: multiplication overflow");
    releaseGold.initialize(config);
  }

}

contract SetBeneficiary is ReleaseGoldTest {
  function setUp() public {
    super.setUp();
    newReleaseGold(true, false);
  }

  function test_ShouldSetBeneficiary() public {
    releaseGold.setBeneficiary(address(uint160((newBeneficiary))));
    assertEq(releaseGold.beneficiary(), newBeneficiary);
  }

  function test_ShouldRevertWhenSettingNewBeneficiaryFromTheReleaseOwner() public {
    vm.expectRevert("Ownable: caller is not the owner");
    vm.prank(releaseOwner);
    releaseGold.setBeneficiary(address(uint160((newBeneficiary))));
  }

  function test_ShouldEmitBeneficiarySetEvent() public {
    vm.expectEmit(true, true, true, true);
    emit BeneficiarySet(newBeneficiary);
    releaseGold.setBeneficiary(address(uint160((newBeneficiary))));
  }
}

contract CreateAccount is ReleaseGoldTest {
  function setUp() public {
    super.setUp();
    newReleaseGold(true, false);
  }

  function test_ShouldCreateTheAccountByBeneficiary_WhenUnrevoked() public {
    assertEq(accounts.isAccount(address(releaseGold)), false);
    vm.prank(beneficiary);
    releaseGold.createAccount();
    assertEq(accounts.isAccount(address(releaseGold)), true);
  }

  function test_ShouldRevertWhenNonBEneficiaryAttemtsAccountCreation_WhenUnrevoked() public {
    vm.expectRevert("Sender must be the beneficiary and state must not be revoked");
    vm.prank(randomAddress);
    releaseGold.createAccount();
  }

  function test_ShouldRevertIfAnyoneAttemptsAccountCreation_WhenRevoked() public {
    vm.prank(releaseOwner);
    releaseGold.revoke();
    vm.expectRevert("Sender must be the beneficiary and state must not be revoked");
    vm.prank(beneficiary);
    releaseGold.createAccount();
  }
}

contract SetAccount is ReleaseGoldTest {
  uint8 v;
  bytes32 r;
  bytes32 s;

  string accountName = "name";
  bytes dataEncryptionKey = hex"02f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111";

  function setUp() public {
    super.setUp();
    newReleaseGold(true, false);
    (v, r, s) = getParsedSignatureOfAddress(address(releaseGold), beneficiaryPrivateKey);
  }

  function test_ShouldSetTheAccountByBEneficiary_WhenUnrevoked() public {
    assertEq(accounts.isAccount(address(releaseGold)), false);
    vm.prank(beneficiary);
    releaseGold.setAccount(accountName, dataEncryptionKey, walletAddress, v, r, s);
    assertEq(accounts.isAccount(address(releaseGold)), true);
  }

  function test_ShouldRevertIfNonBeneficiaryAttemptsToSetTheAccount_WhenUnrevoked() public {
    vm.expectRevert("Sender must be the beneficiary and state must not be revoked");
    vm.prank(randomAddress);
    releaseGold.setAccount(accountName, dataEncryptionKey, walletAddress, v, r, s);
  }

  function test_ShouldSetTheNameDataEncryptionKeyAndWalletAddressOfTheAccountByBeneficiary_WhenUnrevoked()
    public
  {
    vm.prank(beneficiary);
    releaseGold.setAccount(accountName, dataEncryptionKey, walletAddress, v, r, s);
    assertEq(accounts.getName(address(releaseGold)), accountName);
    assertEq(accounts.getDataEncryptionKey(address(releaseGold)), dataEncryptionKey);
    assertEq(accounts.getWalletAddress(address(releaseGold)), walletAddress);
  }

  function test_ShouldRevertIfAnyOneAttemptsToSetTheAccount_WhenRevoked() public {
    vm.prank(releaseOwner);
    releaseGold.revoke();
    vm.expectRevert("Sender must be the beneficiary and state must not be revoked");
    vm.prank(beneficiary);
    releaseGold.setAccount(accountName, dataEncryptionKey, walletAddress, v, r, s);
  }
}

contract SetAccountName is ReleaseGoldTest {
  function setUp() public {
    super.setUp();
    newReleaseGold(true, false);
  }

  function test_ShouldRevert_WhenTheAccountHasNotBeenCreated() public {
    vm.prank(beneficiary);
    vm.expectRevert("Register with createAccount to set account name");
    releaseGold.setAccountName("name");
  }

  function test_ShouldAllowBeneficiaryToSetTheName_WhenAccountWasCreatedAndUnrevoked() public {
    vm.prank(beneficiary);
    releaseGold.createAccount();
    vm.prank(beneficiary);
    releaseGold.setAccountName("name");
    assertEq(accounts.getName(address(releaseGold)), "name");
  }

  function test_ShouldRevertIfNonBeneficiaryTriesToSetName_WhenAccountWasCreatedAndUnrevoked()
    public
  {
    vm.prank(beneficiary);
    releaseGold.createAccount();
    vm.expectRevert("Sender must be the beneficiary and state must not be revoked");
    vm.prank(randomAddress);
    releaseGold.setAccountName("name");
  }

  function test_ShouldNotAllowBeneficiaryToSetTheName_WhenAccountWasCreatedAndRevoked() public {
    vm.prank(beneficiary);
    releaseGold.createAccount();
    vm.prank(releaseOwner);
    releaseGold.revoke();
    vm.prank(beneficiary);
    vm.expectRevert("Sender must be the beneficiary and state must not be revoked");
    releaseGold.setAccountName("name");
  }
}

contract SetAccountWalletAddress is ReleaseGoldTest {
  uint8 v;
  bytes32 r;
  bytes32 s;

  function setUp() public {
    super.setUp();
    newReleaseGold(true, false);
    (v, r, s) = getParsedSignatureOfAddress(address(releaseGold), beneficiaryPrivateKey);
  }

  function test_ShouldRevertWhenReleaseGoldAccountWasNotCreated() public {
    vm.prank(beneficiary);
    vm.expectRevert("Unknown account");
    releaseGold.setAccountWalletAddress(walletAddress, v, r, s);
  }

  function test_ShouldAllowBeneficiaryToSetTheWalletAddress_WhenAccountWasCreatedAndUnrevoked()
    public
  {
    vm.prank(beneficiary);
    releaseGold.createAccount();
    vm.prank(beneficiary);
    releaseGold.setAccountWalletAddress(walletAddress, v, r, s);
    assertEq(accounts.getWalletAddress(address(releaseGold)), walletAddress);
  }

  function test_ShouldRevertIfNonBeneficiaryTriesToSetWalletAddress_WhenAccountWasCreatedAndUnrevoked()
    public
  {
    vm.prank(beneficiary);
    releaseGold.createAccount();
    vm.expectRevert("Sender must be the beneficiary and state must not be revoked");
    vm.prank(randomAddress);
    releaseGold.setAccountWalletAddress(walletAddress, v, r, s);
  }

  function test_ShouldAllowBeneficiaryToSetNullAddress() public {
    vm.prank(beneficiary);
    releaseGold.createAccount();
    vm.prank(beneficiary);
    releaseGold.setAccountWalletAddress(address(0), 0, 0x0, 0x0);
    assertEq(accounts.getWalletAddress(address(releaseGold)), address(0));
  }

  function test_ShouldRevertIfAnyoneAttemptsToSetTheWalletAddress_WhenACcountWasCreatedAndRevoked()
    public
  {
    vm.prank(beneficiary);
    releaseGold.createAccount();
    vm.prank(releaseOwner);
    releaseGold.revoke();
    vm.prank(beneficiary);
    vm.expectRevert("Sender must be the beneficiary and state must not be revoked");
    releaseGold.setAccountWalletAddress(walletAddress, v, r, s);
  }
}

contract SetAccountMetadataURL is ReleaseGoldTest {
  function setUp() public {
    super.setUp();
    newReleaseGold(true, false);
  }

  function test_ShouldRevert_WhenTheAccountHasNotBeenCreated() public {
    vm.prank(beneficiary);
    vm.expectRevert("Unknown account");
    releaseGold.setAccountMetadataURL("url");
  }

  function test_ShouldAllowBeneficiaryToSetTheMetadataURL_WhenAccountWasCreatedAndUnrevoked()
    public
  {
    vm.prank(beneficiary);
    releaseGold.createAccount();
    vm.prank(beneficiary);
    releaseGold.setAccountMetadataURL("url2");
    assertEq(accounts.getMetadataURL(address(releaseGold)), "url2");
  }

  function test_ShouldRevertIfNonBeneficiaryTriesToSetMetadataURL_WhenAccountWasCreatedAndUnrevoked()
    public
  {
    vm.prank(beneficiary);
    releaseGold.createAccount();
    vm.expectRevert("Sender must be the beneficiary and state must not be revoked");
    vm.prank(randomAddress);
    releaseGold.setAccountMetadataURL("url");
  }

  function test_ShouldNotAllowBeneficiaryToSetTheMetadataURL_WhenAccountWasCreatedAndRevoked()
    public
  {
    vm.prank(beneficiary);
    releaseGold.createAccount();
    vm.prank(releaseOwner);
    releaseGold.revoke();
    vm.prank(beneficiary);
    vm.expectRevert("Sender must be the beneficiary and state must not be revoked");
    releaseGold.setAccountMetadataURL("url");
  }
}

contract SetAccountDataEncryptionKey is ReleaseGoldTest {
  bytes dataEncryptionKey = hex"02f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111";
  bytes longDataEncryptionKey = hex"04f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0161111111102f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111";

  function setUp() public {
    super.setUp();
    newReleaseGold(true, false);
    vm.prank(beneficiary);
    releaseGold.createAccount();
  }

  function test_ShouldAllowBeneficiaryToSetTheDataEncryptionKey_WhenAccountWasCreatedAndUnrevoked()
    public
  {
    vm.prank(beneficiary);
    releaseGold.setAccountDataEncryptionKey(dataEncryptionKey);
    assertEq(accounts.getDataEncryptionKey(address(releaseGold)), dataEncryptionKey);
  }

  function test_ShouldRevertIfNonBeneficiaryTriesToSetDataEncryptionKey_WhenAccountWasCreatedAndUnrevoked()
    public
  {
    vm.expectRevert("Sender must be the beneficiary and state must not be revoked");
    vm.prank(randomAddress);
    releaseGold.setAccountDataEncryptionKey(dataEncryptionKey);
  }

  function test_ShouldAllowSettingAKeyWithLEadingZeros() public {
    bytes memory keyWithLeadingZeros = hex"00000000000000000000000000000000000000000000000f2f48ee19680706191111";
    vm.prank(beneficiary);
    releaseGold.setAccountDataEncryptionKey(keyWithLeadingZeros);
    assertEq(accounts.getDataEncryptionKey(address(releaseGold)), keyWithLeadingZeros);
  }

  function test_ShouldRevertWhenTheKeyIsInvalid() public {
    bytes memory invalidKey = hex"321329312493";
    vm.expectRevert("data encryption key length <= 32");
    vm.prank(beneficiary);
    releaseGold.setAccountDataEncryptionKey(invalidKey);
  }

  function test_ShouldAllowKeyLongerThan32() public {
    vm.prank(beneficiary);
    releaseGold.setAccountDataEncryptionKey(longDataEncryptionKey);
    assertEq(accounts.getDataEncryptionKey(address(releaseGold)), longDataEncryptionKey);
  }

}

contract SetMaxDistribution is ReleaseGoldTest {
  function setUp() public {
    super.setUp();
    config.initialDistributionRatio = 0;
    newReleaseGold(true, false);
  }

  function test_ShouldSetMaxDistributionTo5Celo_WhenMaxDistributionIsSetTo50Percent() public {
    vm.prank(releaseOwner);
    releaseGold.setMaxDistribution(500);
    assertEq(releaseGold.maxDistribution(), TOTAL_AMOUNT / 2);
  }

  function test_ShouldSetMaxDistributionTo5Celo_WhenMaxDistributionIsSetTo100Percent() public {
    vm.prank(releaseOwner);
    releaseGold.setMaxDistribution(1000);
    assertTrue(releaseGold.maxDistribution() >= TOTAL_AMOUNT);
  }

  function test_ShouldRevertWhenTryingToLowerMaxDistribution() public {
    vm.prank(releaseOwner);
    releaseGold.setMaxDistribution(1000);
    vm.prank(releaseOwner);
    vm.expectRevert("Cannot set max distribution lower if already set to 1000");
    releaseGold.setMaxDistribution(500);
  }
}

contract AuthorizeWithPublicKeys is ReleaseGoldTest {
  uint8 v;
  bytes32 r;
  bytes32 s;

  address authorized;
  uint256 authorizedPK;

  ISECP256K1 sECP256K1;

  bytes ecdsaPublicKey;

  function addressToPublicKey(bytes32 message, uint8 _v, bytes32 _r, bytes32 _s)
    public
    view
    returns (bytes memory)
  {
    string memory header = "\x19Ethereum Signed Message:\n32";
    bytes32 _message = keccak256(abi.encodePacked(header, message));
    (uint256 x, uint256 y) = sECP256K1.recover(
      uint256(_message),
      _v - 27,
      uint256(_r),
      uint256(_s)
    );
    return abi.encodePacked(x, y);
  }

  function _randomBytes32() internal returns (bytes32) {
    return keccak256(abi.encodePacked(block.timestamp, block.difficulty, msg.sender));
  }

  function _truncateBytes(bytes memory data, uint256 size) internal pure returns (bytes memory) {
    require(size <= data.length, "Size too large");
    bytes memory result = new bytes(size);
    for (uint256 i = 0; i < size; i++) {
      result[i] = data[i];
    }
    return result;
  }

  function setUp() public {
    super.setUp();

    address SECP256K1Address = actor("SECP256K1Address");

    deployCodeTo("SECP256K1.sol", SECP256K1Address);
    sECP256K1 = ISECP256K1(SECP256K1Address);

    config.revocable = false;
    config.canValidate = true;
    config.refundAddress = address(0);
    newReleaseGold(true, false);

    vm.prank(beneficiary);
    releaseGold.createAccount();

    (authorized, authorizedPK) = actorWithPK("authorized");
    (v, r, s) = getParsedSignatureOfAddress(address(releaseGold), authorizedPK);
    ecdsaPublicKey = addressToPublicKey(keccak256(abi.encodePacked("dummy_msg_data")), v, r, s);
  }

  function test_ShouldSetTheAuthorizedKeys_WhenUsingECDSAPublickKey() public {
    vm.prank(beneficiary);
    releaseGold.authorizeValidatorSignerWithPublicKey(
      address(uint160(authorized)),
      v,
      r,
      s,
      ecdsaPublicKey
    );

    assertEq(accounts.authorizedBy(authorized), address(releaseGold));
    assertEq(accounts.getValidatorSigner(address(releaseGold)), authorized);
    assertEq(accounts.validatorSignerToAccount(authorized), address(releaseGold));
  }

  function test_ShouldSetTheAuthorizedKeys_WhenUsingBLSKeys() public {
    bytes32 newBlsPublicKeyPart1 = _randomBytes32();
    bytes32 newBlsPublicKeyPart2 = _randomBytes32();
    bytes32 newBlsPublicKeyPart3 = _randomBytes32();
    bytes memory newBlsPublicKey = abi.encodePacked(
      newBlsPublicKeyPart1,
      newBlsPublicKeyPart2,
      newBlsPublicKeyPart3
    );
    newBlsPublicKey = _truncateBytes(newBlsPublicKey, 96);

    bytes32 newBlsPoPPart1 = _randomBytes32();
    bytes32 newBlsPoPPart2 = _randomBytes32();
    bytes memory newBlsPoP = abi.encodePacked(newBlsPoPPart1, newBlsPoPPart2);
    newBlsPoP = _truncateBytes(newBlsPoP, 48);

    vm.prank(beneficiary);
    releaseGold.authorizeValidatorSignerWithKeys(
      address(uint160(authorized)),
      v,
      r,
      s,
      ecdsaPublicKey,
      newBlsPublicKey,
      newBlsPoP
    );

    assertEq(accounts.authorizedBy(authorized), address(releaseGold));
    assertEq(accounts.getValidatorSigner(address(releaseGold)), authorized);
    assertEq(accounts.validatorSignerToAccount(authorized), address(releaseGold));
  }
}
