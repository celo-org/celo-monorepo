// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import "celo-foundry/Test.sol";
import "@celo-contracts/identity/Escrow.sol";
import "@celo-contracts/identity/FederatedAttestations.sol";
import "@celo-contracts/identity/test/MockAttestations.sol";
import "@celo-contracts/identity/test/MockERC20Token.sol";
import "@celo-contracts/common/FixidityLib.sol";

import "@celo-contracts/common/Registry.sol";
import "@celo-contracts/common/Accounts.sol";
import "@celo-contracts/common/Freezer.sol";
import "@celo-contracts/common/GoldToken.sol";
import "@celo-contracts/governance/LockedGold.sol";
import "@celo-contracts/governance/ReleaseGold.sol";
import "./mocks/ReleaseGoldMockTunnel.sol";
import "@celo-contracts/stability/test/MockStableToken.sol";
import "@celo-contracts/governance/test/MockElection.sol";
import "@celo-contracts/governance/test/MockGovernance.sol";
import "@celo-contracts/governance/test/MockValidators.sol";
import "@test-sol/utils/ECDSAHelper.sol";

contract ReleaseGoldTest is Test, ECDSAHelper {
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
  ReleaseGold releaseGold2;

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

  ReleaseGoldMockTunnel.InitParams initParams;
  ReleaseGoldMockTunnel.InitParams2 initParams2;

  event ReleaseGoldInstanceCreated(address indexed beneficiary, address indexed atAddress);
  event ReleaseScheduleRevoked(uint256 revokeTimestamp, uint256 releasedBalanceAtRevoke);
  event ReleaseGoldInstanceDestroyed(address indexed beneficiary, address indexed atAddress);
  event DistributionLimitSet(address indexed beneficiary, uint256 maxDistribution);
  event LiquidityProvisionSet(address indexed beneficiary);
  event CanExpireSet(bool canExpire);
  event BeneficiarySet(address indexed beneficiary);

  address constant proxyAdminAddress = 0x4200000000000000000000000000000000000018;
  function _whenL2() public {
    deployCodeTo("Registry.sol", abi.encode(false), proxyAdminAddress);
    registry = Registry(proxyAdminAddress);
    registry.setAddressFor("Accounts", address(accounts));
    registry.setAddressFor("Election", address(election));
    registry.setAddressFor("Freezer", address(freezer));
    registry.setAddressFor("GoldToken", address(goldToken));
    registry.setAddressFor("Governance", address(governance));
    registry.setAddressFor("LockedGold", address(lockedGold));
    registry.setAddressFor("Validators", address(validators));
    registry.setAddressFor("StableToken", address(stableToken));

    lockedGold.setRegistry(proxyAdminAddress);
    goldToken.setRegistry(proxyAdminAddress);
    accounts.setRegistry(proxyAdminAddress);
  }

  function newReleaseGold(bool prefund, bool startReleasing) internal returns (ReleaseGold) {
    releaseGold = new ReleaseGold(true);

    if (prefund) {
      goldToken.transfer(
        address(releaseGold),
        initParams.amountReleasedPerPeriod * initParams.numReleasePeriods
      );
    }

    // releaseGold.initialize(config);
    ReleaseGoldMockTunnel tunnel = new ReleaseGoldMockTunnel(address(releaseGold));
    tunnel.MockInitialize(owner, initParams, initParams2);

    if (startReleasing) {
      vm.warp(block.timestamp + initParams.releaseCliffTime + initParams.releasePeriod + 1);
    }
  }

  function getParsedSignatureOfAddress(
    address _address,
    uint256 privateKey
  ) public pure returns (uint8, bytes32, bytes32) {
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

    initParams = ReleaseGoldMockTunnel.InitParams({
      releaseStartTime: block.timestamp + 5 * MINUTE,
      releaseCliffTime: HOUR,
      numReleasePeriods: 4,
      releasePeriod: 3 * MONTH,
      amountReleasedPerPeriod: TOTAL_AMOUNT / 4,
      revocable: true,
      _beneficiary: address(uint160(beneficiary))
    });

    initParams2 = ReleaseGoldMockTunnel.InitParams2({
      _releaseOwner: releaseOwner,
      _refundAddress: address(uint160(refundAddress)),
      subjectToLiquidityProvision: false,
      initialDistributionRatio: 1000,
      _canValidate: false,
      _canVote: true,
      registryAddress: registryAddress
    });

    vm.deal(randomAddress, 1000 ether);
  }
}

contract ReleaseGoldTest_Initialize is ReleaseGoldTest {
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

contract ReleaseGoldTest_Payable is ReleaseGoldTest {
  function setUp() public {
    super.setUp();
  }

  function test_ShouldAcceptGoldTransferByDefaultFromAnyone() public {
    newReleaseGold(true, false);
    uint256 originalBalance = goldToken.balanceOf(address(releaseGold));
    vm.prank(randomAddress);
    goldToken.transfer(address(releaseGold), 2 ether);
    assertEq(goldToken.balanceOf(address(releaseGold)), 2 ether + originalBalance);
  }

  function test_ShouldNotUpdateIsFundedIfSchedulePrincipleNotFulfilled() public {
    newReleaseGold(false, false);
    uint256 insufficientPrinciple = initParams.amountReleasedPerPeriod *
      initParams.numReleasePeriods -
      1;
    goldToken.transfer(address(releaseGold), insufficientPrinciple);
    assertFalse(releaseGold.isFunded());
  }

  function test_ShouldUpdateIsFundedIfSchedulePrincipleIsFulfilledAfterDeploy() public {
    newReleaseGold(false, false);
    uint256 sufficientPrinciple = initParams.amountReleasedPerPeriod * initParams.numReleasePeriods;
    goldToken.transfer(address(releaseGold), sufficientPrinciple);
    assertTrue(releaseGold.isFunded());
  }

  function test_ShouldUpdateIsFundedIfSchedulePrincipleNotFulfilledButHasBegunReleasing() public {
    newReleaseGold(false, true);
    uint256 insufficientPrinciple = initParams.amountReleasedPerPeriod *
      initParams.numReleasePeriods -
      1;
    goldToken.transfer(address(releaseGold), insufficientPrinciple);
    assertTrue(releaseGold.isFunded());
  }
}

contract ReleaseGoldTest_Transfer is ReleaseGoldTest {
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

contract ReleaseGoldTest_GenericTransfer is ReleaseGoldTest {
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

contract ReleaseGoldTest_Creation is ReleaseGoldTest {
  uint256 public maxUint256 = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;

  function setUp() public {
    super.setUp();
  }

  function test_ShouldHaveAssociatedFundsWithAScheduleUponCreation() public {
    newReleaseGold(true, false);
    assertEq(
      goldToken.balanceOf(address(releaseGold)),
      initParams.numReleasePeriods * initParams.amountReleasedPerPeriod
    );
  }

  function test_ShouldSetABeneficiaryToReleaseGoldInstance() public {
    newReleaseGold(true, false);
    assertEq(releaseGold.beneficiary(), initParams._beneficiary);
  }

  function test_ShouldSetAReleaseOwnerToReleaseGoldInstance() public {
    newReleaseGold(true, false);
    assertEq(releaseGold.releaseOwner(), initParams2._releaseOwner);
  }

  function test_ShouldSetReleaseGoldNumberOfPeriods() public {
    newReleaseGold(true, false);
    (, , uint256 releaseGoldNumPeriods, , ) = releaseGold.releaseSchedule();
    assertEq(releaseGoldNumPeriods, initParams.numReleasePeriods);
  }

  function test_ShouldSetReleaseGoldAmountPerPeriod() public {
    newReleaseGold(true, false);
    (, , , , uint256 releaseGoldAmountPerPeriod) = releaseGold.releaseSchedule();
    assertEq(releaseGoldAmountPerPeriod, initParams.amountReleasedPerPeriod);
  }

  function test_ShouldSetReleaseGoldPeriod() public {
    newReleaseGold(true, false);
    (, , , uint256 releaseGoldPeriod, ) = releaseGold.releaseSchedule();
    assertEq(releaseGoldPeriod, initParams.releasePeriod);
  }

  function test_ShouldSetReleaseGoldStartTime() public {
    newReleaseGold(true, false);
    (uint256 releaseGoldStartTime, , , , ) = releaseGold.releaseSchedule();
    assertEq(releaseGoldStartTime, initParams.releaseStartTime);
  }

  function test_ShouldSetReleaseGoldCliffTime() public {
    newReleaseGold(true, false);
    (, uint256 releaseGoldCliffTime, , , ) = releaseGold.releaseSchedule();
    uint256 expectedCliffTime = initParams.releaseStartTime + initParams.releaseCliffTime;
    assertEq(releaseGoldCliffTime, expectedCliffTime);
  }

  function test_ShouldSetRevocableFlagToReleaseGoldInstance() public {
    newReleaseGold(true, false);
    (bool revocable, , , ) = releaseGold.revocationInfo();
    assertEq(revocable, initParams.revocable);
  }

  function test_ShouldSetReleaseOwnerToReleaseGoldInstance() public {
    newReleaseGold(true, false);
    assertEq(releaseGold.releaseOwner(), initParams2._releaseOwner);
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
    releaseGold = new ReleaseGold(true);
    initParams._beneficiary = address(0);
    ReleaseGoldMockTunnel tunnel = new ReleaseGoldMockTunnel(address(releaseGold));
    vm.expectRevert("unsuccessful tunnel call");
    tunnel.MockInitialize(owner, initParams, initParams2);
  }

  function test_ShouldRevertWhenReleaseGoldPeriodsAreZero() public {
    releaseGold2 = new ReleaseGold(true);
    initParams.numReleasePeriods = 0;
    ReleaseGoldMockTunnel tunnel = new ReleaseGoldMockTunnel(address(releaseGold2));
    vm.expectRevert("unsuccessful tunnel call");
    tunnel.MockInitialize(owner, initParams, initParams2);
  }

  function test_ShouldRevertWhenReleasedAmountPerPeriodIsZero() public {
    releaseGold2 = new ReleaseGold(true);
    initParams.amountReleasedPerPeriod = 0;
    ReleaseGoldMockTunnel tunnel = new ReleaseGoldMockTunnel(address(releaseGold2));
    vm.expectRevert("unsuccessful tunnel call");
    tunnel.MockInitialize(owner, initParams, initParams2);
  }

  function test_ShouldOverflowForVeryLargeCombinationsOdReleasePeriodsAndAmountPerTime() public {
    releaseGold = new ReleaseGold(true);
    initParams.numReleasePeriods = maxUint256;
    initParams.amountReleasedPerPeriod = maxUint256;
    initParams2.initialDistributionRatio = 999;
    ReleaseGoldMockTunnel tunnel = new ReleaseGoldMockTunnel(address(releaseGold));
    vm.expectRevert("unsuccessful tunnel call");
    tunnel.MockInitialize(owner, initParams, initParams2);
  }
}

contract ReleaseGoldTest_SetBeneficiary is ReleaseGoldTest {
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

contract ReleaseGoldTest_CreateAccount is ReleaseGoldTest {
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

  function test_ShouldSetTheAccountByBeneficiary_WhenUnrevoked() public {
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

contract ReleaseGoldTest_SetAccountName is ReleaseGoldTest {
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

contract ReleaseGoldTest_SetAccountWalletAddress is ReleaseGoldTest {
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

  function test_ShouldAllowBeneficiaryToSetNullAddress_WhenAccountWasCreatedAndUnrevoked() public {
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

contract ReleaseGoldTest_SetAccountMetadataURL is ReleaseGoldTest {
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

contract ReleaseGoldTest_SetAccountDataEncryptionKey is ReleaseGoldTest {
  bytes dataEncryptionKey = hex"02f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111";
  bytes longDataEncryptionKey =
    hex"04f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e0161111111102f2f48ee19680706196e2e339e5da3491186e0c4c5030670656b0e01611111111";

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
    bytes
      memory keyWithLeadingZeros = hex"00000000000000000000000000000000000000000000000f2f48ee19680706191111";
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

contract ReleaseGoldTest_SetMaxDistribution is ReleaseGoldTest {
  function setUp() public {
    super.setUp();
    initParams2.initialDistributionRatio = 0;
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

  function test_ShouldRevertWhenTryingToLowerMaxDistribution_WhenMaxDistributionIsSetTo100Percent()
    public
  {
    vm.prank(releaseOwner);
    releaseGold.setMaxDistribution(1000);
    vm.prank(releaseOwner);
    vm.expectRevert("Cannot set max distribution lower if already set to 1000");
    releaseGold.setMaxDistribution(500);
  }
}

contract ReleaseGoldTest_AuthorizationTests is ReleaseGoldTest {
  uint256 initialReleaseGoldAmount;

  uint8 v;
  bytes32 r;
  bytes32 s;

  address authorized;
  uint256 authorizedPK;

  function setUp() public {
    super.setUp();
    initParams.revocable = false;
    initParams2._refundAddress = address(0);
    initParams2._canValidate = true;
    newReleaseGold(true, false);
    vm.prank(beneficiary);
    releaseGold.createAccount();

    (authorized, authorizedPK) = actorWithPK("authorized");

    (v, r, s) = getParsedSignatureOfAddress(address(releaseGold), authorizedPK);
  }

  function test_ShouldSetTheAuthorizedVoteSigner() public {
    vm.prank(beneficiary);
    releaseGold.authorizeVoteSigner(address(uint160(authorized)), v, r, s);
    assertEq(accounts.authorizedBy(authorized), address(releaseGold));
    assertEq(accounts.getVoteSigner(address(releaseGold)), authorized);
    assertEq(accounts.voteSignerToAccount(authorized), address(releaseGold));
  }

  function test_ShouldSetTheAuthorizedValidatorSigner() public {
    vm.prank(beneficiary);
    releaseGold.authorizeValidatorSigner(address(uint160(authorized)), v, r, s);
    assertEq(accounts.authorizedBy(authorized), address(releaseGold));
    assertEq(accounts.getValidatorSigner(address(releaseGold)), authorized);
    assertEq(accounts.validatorSignerToAccount(authorized), address(releaseGold));
  }

  function test_ShouldSetTheAuthorizedAttestationSigner() public {
    vm.prank(beneficiary);
    releaseGold.authorizeAttestationSigner(address(uint160(authorized)), v, r, s);
    assertEq(accounts.authorizedBy(authorized), address(releaseGold));
    assertEq(accounts.getAttestationSigner(address(releaseGold)), authorized);
    assertEq(accounts.attestationSignerToAccount(authorized), address(releaseGold));
  }

  function test_ShouldTransfer1CELOToVoteSigner() public {
    uint256 authorizedBalanceBefore = goldToken.balanceOf(authorized);
    vm.prank(beneficiary);
    releaseGold.authorizeVoteSigner(address(uint160(authorized)), v, r, s);
    uint256 authorizedBalanceAfter = goldToken.balanceOf(authorized);
    assertEq(authorizedBalanceAfter - authorizedBalanceBefore, 1 ether);
  }

  function test_ShouldTransfer1CELOToValidatorSigner() public {
    uint256 authorizedBalanceBefore = goldToken.balanceOf(authorized);
    vm.prank(beneficiary);
    releaseGold.authorizeValidatorSigner(address(uint160(authorized)), v, r, s);
    uint256 authorizedBalanceAfter = goldToken.balanceOf(authorized);
    assertEq(authorizedBalanceAfter - authorizedBalanceBefore, 1 ether);
  }

  function test_ShouldNotTransfer1CELOToAttestationSigner() public {
    uint256 authorizedBalanceBefore = goldToken.balanceOf(authorized);
    vm.prank(beneficiary);
    releaseGold.authorizeAttestationSigner(address(uint160(authorized)), v, r, s);
    uint256 authorizedBalanceAfter = goldToken.balanceOf(authorized);
    assertEq(authorizedBalanceAfter - authorizedBalanceBefore, 0);
  }

  function test_ShouldRevertIfVoteSignerIsAnAccount() public {
    vm.prank(authorized);
    accounts.createAccount();
    vm.prank(beneficiary);
    vm.expectRevert("Cannot re-authorize address or locked gold account for another account");
    releaseGold.authorizeVoteSigner(address(uint160(authorized)), v, r, s);
  }

  function test_ShouldRevertIfValidatorSignerIsAnAccount() public {
    vm.prank(authorized);
    accounts.createAccount();
    vm.prank(beneficiary);
    vm.expectRevert("Cannot re-authorize address or locked gold account for another account");
    releaseGold.authorizeValidatorSigner(address(uint160(authorized)), v, r, s);
  }

  function test_ShouldRevertIfAttestationSignerIsAnAccount() public {
    vm.prank(authorized);
    accounts.createAccount();
    vm.prank(beneficiary);
    vm.expectRevert("Cannot re-authorize address or locked gold account for another account");
    releaseGold.authorizeAttestationSigner(address(uint160(authorized)), v, r, s);
  }

  function test_ShouldRevertIfTheVoteSignerIsAlreadyAuthorized() public {
    (address otherAccount, uint256 otherAccountPK) = actorWithPK("otherAccount");
    (uint8 otherV, bytes32 otherR, bytes32 otherS) = getParsedSignatureOfAddress(
      address(releaseGold),
      otherAccountPK
    );
    vm.prank(otherAccount);
    accounts.createAccount();
    vm.expectRevert("Cannot re-authorize address or locked gold account for another account");
    vm.prank(beneficiary);
    releaseGold.authorizeVoteSigner(address(uint160(otherAccount)), otherV, otherR, otherS);
  }

  function test_ShouldRevertIfTheValidatorSignerIsAlreadyAuthorized() public {
    (address otherAccount, uint256 otherAccountPK) = actorWithPK("otherAccount");
    (uint8 otherV, bytes32 otherR, bytes32 otherS) = getParsedSignatureOfAddress(
      address(releaseGold),
      otherAccountPK
    );
    vm.prank(otherAccount);
    accounts.createAccount();
    vm.expectRevert("Cannot re-authorize address or locked gold account for another account");
    vm.prank(beneficiary);
    releaseGold.authorizeValidatorSigner(address(uint160(otherAccount)), otherV, otherR, otherS);
  }

  function test_ShouldRevertIfTheAttestationSignerIsAlreadyAuthorized() public {
    (address otherAccount, uint256 otherAccountPK) = actorWithPK("otherAccount");
    (uint8 otherV, bytes32 otherR, bytes32 otherS) = getParsedSignatureOfAddress(
      address(releaseGold),
      otherAccountPK
    );
    vm.prank(otherAccount);
    accounts.createAccount();
    vm.expectRevert("Cannot re-authorize address or locked gold account for another account");
    vm.prank(beneficiary);
    releaseGold.authorizeAttestationSigner(address(uint160(otherAccount)), otherV, otherR, otherS);
  }

  function test_ShouldRevertIfTheSignatureIsIncorrect() public {
    (address otherAccount, uint256 otherAccountPK) = actorWithPK("otherAccount");
    (uint8 otherV, bytes32 otherR, bytes32 otherS) = getParsedSignatureOfAddress(
      address(releaseGold),
      otherAccountPK
    );
    vm.prank(beneficiary);
    vm.expectRevert("Invalid signature");
    releaseGold.authorizeVoteSigner(address(uint160(authorized)), otherV, otherR, otherS);
  }

  function test_ShouldSetTheNewAuthorizedVoteSigner_WhenPreviousAuthorizationHasBeenMade() public {
    vm.prank(beneficiary);
    releaseGold.authorizeVoteSigner(address(uint160(authorized)), v, r, s);
    assertEq(accounts.getVoteSigner(address(releaseGold)), authorized);

    (address otherAccount, uint256 otherAccountPK) = actorWithPK("otherAccount2");
    (uint8 otherV, bytes32 otherR, bytes32 otherS) = getParsedSignatureOfAddress(
      address(releaseGold),
      otherAccountPK
    );
    vm.prank(beneficiary);
    releaseGold.authorizeVoteSigner(address(uint160(otherAccount)), otherV, otherR, otherS);

    assertEq(accounts.authorizedBy(otherAccount), address(releaseGold));
    assertEq(accounts.getVoteSigner(address(releaseGold)), otherAccount);
    assertEq(accounts.voteSignerToAccount(otherAccount), address(releaseGold));
  }

  function test_ShouldSetTheNewAuthorizedValidatorSigner_WhenPreviousAuthorizationHasBeenMade()
    public
  {
    vm.prank(beneficiary);
    releaseGold.authorizeValidatorSigner(address(uint160(authorized)), v, r, s);
    assertEq(accounts.getValidatorSigner(address(releaseGold)), authorized);

    (address otherAccount, uint256 otherAccountPK) = actorWithPK("otherAccount2");
    (uint8 otherV, bytes32 otherR, bytes32 otherS) = getParsedSignatureOfAddress(
      address(releaseGold),
      otherAccountPK
    );
    vm.prank(beneficiary);
    releaseGold.authorizeValidatorSigner(address(uint160(otherAccount)), otherV, otherR, otherS);

    assertEq(accounts.authorizedBy(otherAccount), address(releaseGold));
    assertEq(accounts.getValidatorSigner(address(releaseGold)), otherAccount);
    assertEq(accounts.validatorSignerToAccount(otherAccount), address(releaseGold));
  }

  function test_ShouldSetTheNewAuthorizedAttestationSigner_WhenPreviousAuthorizationHasBeenMade()
    public
  {
    vm.prank(beneficiary);
    releaseGold.authorizeAttestationSigner(address(uint160(authorized)), v, r, s);
    assertEq(accounts.getAttestationSigner(address(releaseGold)), authorized);

    (address otherAccount, uint256 otherAccountPK) = actorWithPK("otherAccount2");
    (uint8 otherV, bytes32 otherR, bytes32 otherS) = getParsedSignatureOfAddress(
      address(releaseGold),
      otherAccountPK
    );
    vm.prank(beneficiary);
    releaseGold.authorizeAttestationSigner(address(uint160(otherAccount)), otherV, otherR, otherS);

    assertEq(accounts.authorizedBy(otherAccount), address(releaseGold));
    assertEq(accounts.getAttestationSigner(address(releaseGold)), otherAccount);
    assertEq(accounts.attestationSignerToAccount(otherAccount), address(releaseGold));
  }

  function test_ShouldNotTransfer1CEloWhenNewAuthorizedVoteSigner_WhenPreviousAuthorizationHasBeenMade()
    public
  {
    vm.prank(beneficiary);
    releaseGold.authorizeVoteSigner(address(uint160(authorized)), v, r, s);
    assertEq(accounts.getVoteSigner(address(releaseGold)), authorized);

    (address otherAccount, uint256 otherAccountPK) = actorWithPK("otherAccount2");
    uint256 otherAccountBalanceBefore = goldToken.balanceOf(otherAccount);
    (uint8 otherV, bytes32 otherR, bytes32 otherS) = getParsedSignatureOfAddress(
      address(releaseGold),
      otherAccountPK
    );
    vm.prank(beneficiary);
    releaseGold.authorizeVoteSigner(address(uint160(otherAccount)), otherV, otherR, otherS);

    uint256 otherAccountBalanceAfter = goldToken.balanceOf(otherAccount);
    assertEq(otherAccountBalanceAfter - otherAccountBalanceBefore, 0);
  }

  function test_ShouldNotTransfer1CEloWhenNewAuthorizedValidatorSigner_WhenPreviousAuthorizationHasBeenMade()
    public
  {
    vm.prank(beneficiary);
    releaseGold.authorizeValidatorSigner(address(uint160(authorized)), v, r, s);
    assertEq(accounts.getValidatorSigner(address(releaseGold)), authorized);

    (address otherAccount, uint256 otherAccountPK) = actorWithPK("otherAccount2");
    uint256 otherAccountBalanceBefore = goldToken.balanceOf(otherAccount);
    (uint8 otherV, bytes32 otherR, bytes32 otherS) = getParsedSignatureOfAddress(
      address(releaseGold),
      otherAccountPK
    );
    vm.prank(beneficiary);
    releaseGold.authorizeValidatorSigner(address(uint160(otherAccount)), otherV, otherR, otherS);

    uint256 otherAccountBalanceAfter = goldToken.balanceOf(otherAccount);
    assertEq(otherAccountBalanceAfter - otherAccountBalanceBefore, 0);
  }

  function test_ShouldNotTransfer1CEloWhenNewAuthorizedAttestationSigner_WhenPreviousAuthorizationHasBeenMade()
    public
  {
    vm.prank(beneficiary);
    releaseGold.authorizeAttestationSigner(address(uint160(authorized)), v, r, s);
    assertEq(accounts.getAttestationSigner(address(releaseGold)), authorized);

    (address otherAccount, uint256 otherAccountPK) = actorWithPK("otherAccount2");
    uint256 otherAccountBalanceBefore = goldToken.balanceOf(otherAccount);
    (uint8 otherV, bytes32 otherR, bytes32 otherS) = getParsedSignatureOfAddress(
      address(releaseGold),
      otherAccountPK
    );
    vm.prank(beneficiary);
    releaseGold.authorizeAttestationSigner(address(uint160(otherAccount)), otherV, otherR, otherS);

    uint256 otherAccountBalanceAfter = goldToken.balanceOf(otherAccount);
    assertEq(otherAccountBalanceAfter - otherAccountBalanceBefore, 0);
  }

  function test_ShouldPreserveOriginalAuthorizationWhenNewAuthorizedVoteSigner_WhenPreviousAuthorizationHasBeenMade()
    public
  {
    vm.prank(beneficiary);
    releaseGold.authorizeVoteSigner(address(uint160(authorized)), v, r, s);
    assertEq(accounts.getVoteSigner(address(releaseGold)), authorized);

    (address otherAccount, uint256 otherAccountPK) = actorWithPK("otherAccount2");
    (uint8 otherV, bytes32 otherR, bytes32 otherS) = getParsedSignatureOfAddress(
      address(releaseGold),
      otherAccountPK
    );
    vm.prank(beneficiary);
    releaseGold.authorizeVoteSigner(address(uint160(otherAccount)), otherV, otherR, otherS);

    assertEq(accounts.authorizedBy(authorized), address(releaseGold));
  }

  function test_ShouldPreserveOriginalAuthorizationWhenNewAuthorizedValidatorSigner_WhenPreviousAuthorizationHasBeenMade()
    public
  {
    vm.prank(beneficiary);
    releaseGold.authorizeValidatorSigner(address(uint160(authorized)), v, r, s);
    assertEq(accounts.getValidatorSigner(address(releaseGold)), authorized);

    (address otherAccount, uint256 otherAccountPK) = actorWithPK("otherAccount2");
    (uint8 otherV, bytes32 otherR, bytes32 otherS) = getParsedSignatureOfAddress(
      address(releaseGold),
      otherAccountPK
    );
    vm.prank(beneficiary);
    releaseGold.authorizeValidatorSigner(address(uint160(otherAccount)), otherV, otherR, otherS);

    assertEq(accounts.authorizedBy(authorized), address(releaseGold));
  }

  function test_ShouldPreserveOriginalAuthorizationWhenNewAuthorizedAttestationSigner_WhenPreviousAuthorizationHasBeenMade()
    public
  {
    vm.prank(beneficiary);
    releaseGold.authorizeAttestationSigner(address(uint160(authorized)), v, r, s);
    assertEq(accounts.getAttestationSigner(address(releaseGold)), authorized);

    (address otherAccount, uint256 otherAccountPK) = actorWithPK("otherAccount2");
    (uint8 otherV, bytes32 otherR, bytes32 otherS) = getParsedSignatureOfAddress(
      address(releaseGold),
      otherAccountPK
    );
    vm.prank(beneficiary);
    releaseGold.authorizeAttestationSigner(address(uint160(otherAccount)), otherV, otherR, otherS);

    assertEq(accounts.authorizedBy(authorized), address(releaseGold));
  }
}

contract ReleaseGoldTest_AuthorizeWithPublicKeys is ReleaseGoldTest {
  uint8 v;
  bytes32 r;
  bytes32 s;

  address authorized;
  uint256 authorizedPK;

  bytes ecdsaPublicKey;

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

    initParams.revocable = false;
    initParams2._canValidate = true;
    initParams2._refundAddress = address(0);
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

  function test_Reverts_WhenAuthorizeValidatorSignerWithPublicKeyCalledOnL2() public {
    _whenL2();
    vm.expectRevert("This method is no longer supported in L2.");
    vm.prank(beneficiary);
    releaseGold.authorizeValidatorSignerWithPublicKey(
      address(uint160(authorized)),
      v,
      r,
      s,
      ecdsaPublicKey
    );
  }

  function test_Reverts_WhenAuthorizeValidatorSignerWithKeysCalledOnL2() public {
    _whenL2();
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

    vm.expectRevert("This method is no longer supported in L2.");

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
  }
}

contract ReleaseGoldTest_Revoke is ReleaseGoldTest {
  function setUp() public {
    super.setUp();
  }

  function test_ShouldAllowReleaseOwnerToRevokeTheReleaseGOld() public {
    newReleaseGold(true, false);
    vm.expectEmit(true, true, true, true);
    emit ReleaseScheduleRevoked(block.timestamp, releaseGold.getCurrentReleasedTotalAmount());
    vm.prank(releaseOwner);
    releaseGold.revoke();
    assertEq(releaseGold.isRevoked(), true);
    (, , , uint256 revokeTime) = releaseGold.revocationInfo();
    assertEq(revokeTime, block.timestamp);
  }

  function test_ShouldRevertWhenNonReleaseOwnerAttemptsToRevokeTheReleaseGold() public {
    newReleaseGold(true, false);
    vm.expectRevert("Sender must be the registered releaseOwner address");
    vm.prank(randomAddress);
    releaseGold.revoke();
  }

  function test_ShouldRevertWhenReleaseGoldIsAlreadyRevoked() public {
    newReleaseGold(true, false);
    vm.prank(releaseOwner);
    releaseGold.revoke();
    vm.expectRevert("Release schedule instance must not already be revoked");
    vm.prank(releaseOwner);
    releaseGold.revoke();
  }

  function test_ShouldRevertIfReleaseGoldIsNonRevocable() public {
    initParams.revocable = false;
    initParams2._refundAddress = address(0);
    newReleaseGold(true, false);
    vm.expectRevert("Release schedule instance must be revocable");
    vm.prank(releaseOwner);
    releaseGold.revoke();
  }
}

contract ReleaseGoldTest_Expire is ReleaseGoldTest {
  function setUp() public {
    super.setUp();
    newReleaseGold(true, false);
  }

  function test_ShouldRevert_WhenCalledBeforeExpirationTimeHasPassed() public {
    vm.expectRevert("`EXPIRATION_TIME` must have passed after the end of releasing");
    vm.prank(releaseOwner);
    releaseGold.expire();
  }

  function test_ShouldRevertBeforeEXPIRATION_TIMEAfterReleaseScheduleEnd_WhenTheContractHasFinishedReleasing()
    public
  {
    (, , uint256 numReleasePeriods, uint256 releasePeriod, ) = releaseGold.releaseSchedule();
    vm.warp(block.timestamp + numReleasePeriods * releasePeriod + 5 * MINUTE);
    vm.expectRevert("`EXPIRATION_TIME` must have passed after the end of releasing");
    vm.prank(releaseOwner);
    releaseGold.expire();
  }

  function test_ShouldRevert_WhenNotCalledByReleaseOwner_WhenEXPIRATION_TIMEHasPassedAfterReleaseScheduleCompletion()
    public
  {
    (uint256 releaseStartTime, , uint256 numReleasePeriods, uint256 releasePeriod, ) = releaseGold
      .releaseSchedule();
    vm.warp(
      releaseStartTime + numReleasePeriods * releasePeriod + releaseGold.EXPIRATION_TIME() + 1
    );
    vm.expectRevert("Sender must be the registered releaseOwner address");
    vm.prank(randomAddress);
    releaseGold.expire();
  }

  function test_ShouldSucceed_WhenCalledByReleaseOwner_WhenEXPIRATION_TIMEHasPassedAfterReleaseScheduleCompletion()
    public
  {
    (uint256 releaseStartTime, , uint256 numReleasePeriods, uint256 releasePeriod, ) = releaseGold
      .releaseSchedule();
    vm.warp(
      releaseStartTime + numReleasePeriods * releasePeriod + releaseGold.EXPIRATION_TIME() + 1
    );
    vm.prank(releaseOwner);
    releaseGold.expire();

    assertEq(releaseGold.isRevoked(), true);
    (, , uint256 releasedBalanceAtRevoke, ) = releaseGold.revocationInfo();
    assertEq(releasedBalanceAtRevoke, 0);
  }

  function test_ShouldAllowToRefundOfAllRemainingGold_WhenAnInstanceIsExpired_WhenBeneficiaryHasNotWithdrawnAnyBalanceYet_WhenEXPIRATION_TIMEHasPassedAfterReleaseScheduleCompletion()
    public
  {
    (uint256 releaseStartTime, , uint256 numReleasePeriods, uint256 releasePeriod, ) = releaseGold
      .releaseSchedule();
    vm.warp(
      releaseStartTime + numReleasePeriods * releasePeriod + releaseGold.EXPIRATION_TIME() + 1
    );
    vm.prank(releaseOwner);
    releaseGold.expire();

    uint256 balanceBefore = goldToken.balanceOf(initParams2._refundAddress);
    vm.prank(releaseOwner);
    releaseGold.refundAndFinalize();
    uint256 balanceAfter = goldToken.balanceOf(initParams2._refundAddress);
    assertEq(balanceAfter - balanceBefore, TOTAL_AMOUNT);
  }

  function test_ShouldRevokeTheContract_WhenAnInstanceIsExpired_WhenBeneficiaryHasNotWithdrawnAnyBalanceYet_WhenEXPIRATION_TIMEHasPassedAfterReleaseScheduleCompletionAndBeneficiaryHasWithdrawnSomeBalance()
    public
  {
    (uint256 releaseStartTime, , uint256 numReleasePeriods, uint256 releasePeriod, ) = releaseGold
      .releaseSchedule();
    vm.warp(
      releaseStartTime + numReleasePeriods * releasePeriod + releaseGold.EXPIRATION_TIME() + 1
    );

    vm.prank(releaseOwner);
    releaseGold.expire();
    assertEq(releaseGold.isRevoked(), true);
  }

  function test_SetTheReleasedBalanceAtRevocationToTotalWithdrawn_WhenAnInstanceIsExpired_WhenBeneficiaryHasNotWithdrawnAnyBalanceYet_WhenEXPIRATION_TIMEHasPassedAfterReleaseScheduleCompletionAndBeneficiaryHasWithdrawnSomeBalance()
    public
  {
    (uint256 releaseStartTime, , uint256 numReleasePeriods, uint256 releasePeriod, ) = releaseGold
      .releaseSchedule();
    vm.warp(
      releaseStartTime + numReleasePeriods * releasePeriod + releaseGold.EXPIRATION_TIME() + 1
    );

    vm.prank(releaseOwner);
    releaseGold.expire();

    (, , uint256 releasedBalanceAtRevoke, ) = releaseGold.revocationInfo();
    assertEq(releasedBalanceAtRevoke, 0);
  }

  function test_ShouldAllowToRefundOfAllRemainingGold_WhenAnInstanceIsExpired_WhenBeneficiaryHasWithdrawnSomeBalance_WhenEXPIRATION_TIMEHasPassedAfterReleaseScheduleCompletionAndBeneficiaryHasWithdrawnSomeBalance()
    public
  {
    (uint256 releaseStartTime, , uint256 numReleasePeriods, uint256 releasePeriod, ) = releaseGold
      .releaseSchedule();
    vm.warp(
      releaseStartTime + numReleasePeriods * releasePeriod + releaseGold.EXPIRATION_TIME() + 1
    );
    vm.prank(beneficiary);
    releaseGold.withdraw(TOTAL_AMOUNT / 2);
    vm.prank(releaseOwner);
    releaseGold.expire();

    uint256 balanceBefore = goldToken.balanceOf(initParams2._refundAddress);
    vm.prank(releaseOwner);
    releaseGold.refundAndFinalize();
    uint256 balanceAfter = goldToken.balanceOf(initParams2._refundAddress);
    assertEq(balanceAfter - balanceBefore, TOTAL_AMOUNT / 2);
  }

  function test_ShouldRevertWhenContractIsNotExpirable() public {
    vm.prank(beneficiary);
    releaseGold.setCanExpire(false);

    (uint256 releaseStartTime, , uint256 numReleasePeriods, uint256 releasePeriod, ) = releaseGold
      .releaseSchedule();
    vm.warp(
      releaseStartTime + numReleasePeriods * releasePeriod + releaseGold.EXPIRATION_TIME() + 1
    );

    vm.expectRevert("Contract must be expirable");
    vm.prank(releaseOwner);
    releaseGold.expire();
  }
}

contract ReleaseGoldTest_RefundAndFinalize is ReleaseGoldTest {
  function setUp() public {
    super.setUp();
    newReleaseGold(true, false);

    // wait some time for some gold to release
    vm.warp(block.timestamp + 7 * MONTH);
  }

  function test_ShouldBeCallableByReleaseOwnerAndWhenRevoked() public {
    vm.prank(releaseOwner);
    releaseGold.revoke();
    vm.prank(releaseOwner);
    releaseGold.refundAndFinalize();
  }

  function test_ShouldRevertWhenRevokeCalledByNonReleaseOwner() public {
    vm.prank(releaseOwner);
    releaseGold.revoke();
    vm.expectRevert("Sender must be the releaseOwner and state must be revoked");
    vm.prank(randomAddress);
    releaseGold.refundAndFinalize();
  }

  function test_ShouldRevertWhenNonRevokedButCalledByReleaseOwner() public {
    vm.expectRevert("Sender must be the releaseOwner and state must be revoked");
    vm.prank(releaseOwner);
    releaseGold.refundAndFinalize();
  }

  function test_ShouldTransferGoldProportionsToBothBeneficiaryAndRefundAddressWhenNoGoldLocked_WhenRevoked()
    public
  {
    vm.prank(releaseOwner);
    releaseGold.revoke();

    uint256 refundAddressBalanceBefore = goldToken.balanceOf(initParams2._refundAddress);
    uint256 beneficiaryBalanceBefore = goldToken.balanceOf(initParams._beneficiary);
    (, , uint256 releasedBalanceAtRevoke, ) = releaseGold.revocationInfo();
    uint256 beneficiaryRefundAmount = releasedBalanceAtRevoke - releaseGold.totalWithdrawn();
    uint256 refundAddressRefundAmount = goldToken.balanceOf(address(releaseGold)) -
      beneficiaryRefundAmount;
    vm.prank(releaseOwner);
    releaseGold.refundAndFinalize();
    uint256 releaseGoldContractBalanceAfterFinalize = goldToken.balanceOf(address(goldToken));

    uint256 refundAddressBalanceAfter = goldToken.balanceOf(initParams2._refundAddress);
    uint256 beneficiaryBalanceAfter = goldToken.balanceOf(initParams._beneficiary);

    assertEq(beneficiaryBalanceAfter - beneficiaryBalanceBefore, beneficiaryRefundAmount);
    assertEq(refundAddressBalanceAfter - refundAddressBalanceBefore, refundAddressRefundAmount);

    assertEq(releaseGoldContractBalanceAfterFinalize, 0);
  }
}

contract ReleaseGoldTest_ExpireSelfDestructTest is ReleaseGoldTest {
  function setUp() public {
    super.setUp();
    newReleaseGold(true, false);

    vm.prank(releaseOwner);
    releaseGold.revoke();
    vm.prank(releaseOwner);
    // selfdestruct can be tested only when called in setUp since destruction itself happens only after call is finished
    releaseGold.refundAndFinalize();
  }

  function test_ShouldDestructReleaseGoldInstanceAfterFinalizingAndPreventCallingFurtherActions_WhenRevoked()
    public
  {
    vm.expectRevert();
    releaseGold.getRemainingUnlockedBalance();
  }
}

contract ReleaseGoldTest_LockGold is ReleaseGoldTest {
  uint256 lockAmount;
  function setUp() public {
    super.setUp();
    newReleaseGold(true, false);
    lockAmount = initParams.amountReleasedPerPeriod * initParams.numReleasePeriods;
  }

  function test_ShouldAllowBeneficiaryToLockUpAnyUnlockedAmount() public {
    vm.prank(beneficiary);
    releaseGold.createAccount();
    vm.prank(beneficiary);
    releaseGold.lockGold(lockAmount);
    assertEq(lockedGold.getNonvotingLockedGold(), lockAmount);
    assertEq(lockedGold.getTotalLockedGold(), lockAmount);
  }

  function test_ShouldRevertIfReleaseGoldInstanceIsNotAccount() public {
    vm.expectRevert("Must first register address with Account.createAccount");
    vm.prank(beneficiary);
    releaseGold.lockGold(lockAmount);
  }

  function test_ShouldRevertIfBeneficiaryTriesToLockUpMoreThanThereIsRemainingInTheContract()
    public
  {
    vm.prank(beneficiary);
    releaseGold.createAccount();
    vm.prank(beneficiary);
    vm.expectRevert();
    releaseGold.lockGold(lockAmount + 1);
  }

  function test_ShouldRevertIfNonBeneficiaryTriesToLockUpAnyUnlockedAmount() public {
    vm.prank(beneficiary);
    releaseGold.createAccount();
    vm.expectRevert("Sender must be the beneficiary and state must not be revoked");
    vm.prank(randomAddress);
    releaseGold.lockGold(lockAmount);
  }
}

contract ReleaseGoldTest_UnlockGold is ReleaseGoldTest {
  uint256 lockAmount;
  function setUp() public {
    super.setUp();
    newReleaseGold(true, false);
    vm.prank(beneficiary);
    releaseGold.createAccount();
    lockAmount = initParams.amountReleasedPerPeriod * initParams.numReleasePeriods;
  }

  function test_ShouldAllowBeneficiaryToUnlockHisLockedGoldAndAddAPendingWithdrawal() public {
    vm.prank(beneficiary);
    releaseGold.lockGold(lockAmount);
    vm.prank(beneficiary);
    releaseGold.unlockGold(lockAmount);
    (uint256[] memory values, uint256[] memory timestamps) = lockedGold.getPendingWithdrawals(
      address(releaseGold)
    );
    assertEq(values.length, 1);
    assertEq(timestamps.length, 1);

    assertEq(values[0], lockAmount);
    assertEq(timestamps[0], block.timestamp + UNLOCKING_PERIOD);

    assertEq(lockedGold.getAccountTotalLockedGold(address(releaseGold)), 0);
    assertEq(releaseGold.getRemainingLockedBalance(), lockAmount);
    assertEq(lockedGold.getAccountNonvotingLockedGold(address(releaseGold)), 0);
    assertEq(lockedGold.getNonvotingLockedGold(), 0);
    assertEq(lockedGold.getTotalLockedGold(), 0);
  }

  function test_ShouldRevertIfNonBeneficiaryTriesToUnlockTheLockedAmount() public {
    vm.prank(beneficiary);
    releaseGold.lockGold(lockAmount);
    vm.expectRevert("Must be called by releaseOwner when revoked or beneficiary before revocation");
    vm.prank(randomAddress);
    releaseGold.unlockGold(lockAmount);
  }

  function test_ShouldRevertIfBeneficiaryInVotingTriesToUnlockTheLockedAmount() public {
    governance.setTotalVotes(address(releaseGold), lockAmount);
    vm.prank(beneficiary);
    releaseGold.lockGold(lockAmount);
    vm.expectRevert("Not enough unlockable celo. Celo is locked in voting.");
    vm.prank(beneficiary);
    releaseGold.unlockGold(lockAmount);
  }

  function test_ShouldRevertIfBeneficiaryWithBalanceRequirementsTriesToUnlockTheLockedAmount()
    public
  {
    governance.setVoting(address(releaseGold));
    vm.prank(beneficiary);
    releaseGold.lockGold(lockAmount);
    validators.setAccountLockedGoldRequirement(address(releaseGold), 10);
    vm.expectRevert(
      "Either account doesn't have enough locked Celo or locked Celo is being used for voting."
    );
    vm.prank(beneficiary);
    releaseGold.unlockGold(lockAmount);
  }
}

contract ReleaseGoldTest_WithdrawLockedGold is ReleaseGoldTest {
  uint256 value = 1000;
  uint256 index = 0;

  function setUp() public {
    super.setUp();
    newReleaseGold(true, false);
  }

  function test_ShouldRemoveThePendingWithdrawal_WhenItIsAfterTheAvailabilityTime_WhenPendingWithdrawalExits()
    public
  {
    vm.startPrank(beneficiary);
    releaseGold.createAccount();
    releaseGold.lockGold(value);
    releaseGold.unlockGold(value);

    vm.warp(block.timestamp + UNLOCKING_PERIOD + 1);
    releaseGold.withdrawLockedGold(index);

    (uint256[] memory values, uint256[] memory timestamps) = lockedGold.getPendingWithdrawals(
      address(releaseGold)
    );

    assertEq(values.length, 0);
    assertEq(timestamps.length, 0);
    assertEq(releaseGold.getRemainingLockedBalance(), 0);

    vm.stopPrank();
  }

  function test_ShouldRevert_WhenItIsBeforeTheAvailabilityTime_WhenPendingWithdrawalExits() public {
    vm.startPrank(beneficiary);
    releaseGold.createAccount();
    releaseGold.lockGold(value);
    releaseGold.unlockGold(value);

    vm.warp(block.timestamp + UNLOCKING_PERIOD - 1);
    vm.expectRevert("Pending withdrawal not available");
    releaseGold.withdrawLockedGold(index);

    vm.stopPrank();
  }

  function test_ShouldRevert_WhenCalledByNonBeneficiary_WhenItIsAfterTheAvailabilityTime_WhenPendingWithdrawalExits()
    public
  {
    vm.startPrank(beneficiary);
    releaseGold.createAccount();
    releaseGold.lockGold(value);
    releaseGold.unlockGold(value);
    vm.stopPrank();

    vm.warp(block.timestamp + UNLOCKING_PERIOD + 1);
    vm.expectRevert("Must be called by releaseOwner when revoked or beneficiary before revocation");
    vm.prank(randomAddress);
    releaseGold.withdrawLockedGold(index);
  }

  function test_ShouldRevert_WhenPendingWithdrawalDoesNotExist() public {
    vm.prank(beneficiary);
    releaseGold.createAccount();

    vm.warp(block.timestamp + UNLOCKING_PERIOD + 1);
    vm.expectRevert("Bad pending withdrawal index");
    vm.prank(beneficiary);
    releaseGold.withdrawLockedGold(index);
  }
}

contract ReleaseGoldTest_RelockGold is ReleaseGoldTest {
  uint256 pendingWithdrawalValue = 1000;
  uint256 index = 0;

  function setUp() public {
    super.setUp();
    newReleaseGold(true, false);
    vm.startPrank(beneficiary);
    releaseGold.createAccount();
    releaseGold.lockGold(pendingWithdrawalValue);
    releaseGold.unlockGold(pendingWithdrawalValue);
    vm.stopPrank();
  }

  function test_ShouldIncreaseUpdateCorrectly_WhenRelockingValueEqualToValueOfThePendingWithdrawal_WhenPendingWithdrawalExits()
    public
  {
    vm.prank(beneficiary);
    releaseGold.relockGold(index, pendingWithdrawalValue);

    assertEq(
      lockedGold.getAccountNonvotingLockedGold(address(releaseGold)),
      pendingWithdrawalValue
    );
    assertEq(lockedGold.getAccountTotalLockedGold(address(releaseGold)), pendingWithdrawalValue);
    assertEq(lockedGold.getNonvotingLockedGold(), pendingWithdrawalValue);
    assertEq(lockedGold.getTotalLockedGold(), pendingWithdrawalValue);

    (uint256[] memory values, uint256[] memory timestamps) = lockedGold.getPendingWithdrawals(
      address(releaseGold)
    );
    assertEq(values.length, 0);
    assertEq(timestamps.length, 0);
  }

  function test_ShouldIncreaseAccountNonVotingLockedGoldCorrectly_WhenRelockingValueLessToValueOfThePendingWithdrawalAndWhenPendingWithdrawalExits()
    public
  {
    vm.prank(beneficiary);
    releaseGold.relockGold(index, pendingWithdrawalValue - 1);

    assertEq(
      lockedGold.getAccountNonvotingLockedGold(address(releaseGold)),
      pendingWithdrawalValue - 1
    );
  }

  function test_ShouldIncreaseTotalAccountLockedGoldCorrectly_WhenRelockingValueLessToValueOfThePendingWithdrawalAndWhenPendingWithdrawalExits()
    public
  {
    vm.prank(beneficiary);
    releaseGold.relockGold(index, pendingWithdrawalValue - 1);

    assertEq(
      lockedGold.getAccountTotalLockedGold(address(releaseGold)),
      pendingWithdrawalValue - 1
    );
  }

  function test_ShouldIncreaseTotalNonVotingLockedGoldCorrectly_WhenRelockingValueLessToValueOfThePendingWithdrawalAndWhenPendingWithdrawalExits()
    public
  {
    vm.prank(beneficiary);
    releaseGold.relockGold(index, pendingWithdrawalValue - 1);

    assertEq(lockedGold.getNonvotingLockedGold(), pendingWithdrawalValue - 1);
  }

  function test_ShouldIncreaseTotalLockedGoldCorrectly_WhenRelockingValueLessToValueOfThePendingWithdrawalAndWhenPendingWithdrawalExits()
    public
  {
    vm.prank(beneficiary);
    releaseGold.relockGold(index, pendingWithdrawalValue - 1);

    assertEq(lockedGold.getTotalLockedGold(), pendingWithdrawalValue - 1);
  }

  function test_ShouldUpdatePendingWithdrawalsCorrectly_WhenRelockingValueLessToValueOfThePendingWithdrawalAndWhenPendingWithdrawalExits()
    public
  {
    vm.prank(beneficiary);
    releaseGold.relockGold(index, pendingWithdrawalValue - 1);

    (uint256[] memory values, uint256[] memory timestamps) = lockedGold.getPendingWithdrawals(
      address(releaseGold)
    );
    assertEq(values.length, 1);
    assertEq(timestamps.length, 1);
    assertEq(values[0], 1);
  }

  function test_ShouldRevert_WhenRelockingValueLessToValueOfThePendingWithdrawal_WhenPendingWithdrawalExits()
    public
  {
    vm.expectRevert("Requested value larger than pending value");
    vm.prank(beneficiary);
    releaseGold.relockGold(index, pendingWithdrawalValue + 1);
  }

  function test_ShouldRevertWhenPendingWithdrawalDoesNotExit() public {
    vm.expectRevert("Bad pending withdrawal index");
    vm.prank(beneficiary);
    releaseGold.relockGold(1, pendingWithdrawalValue);
  }
}

contract ReleaseGoldTest_Withdraw is ReleaseGoldTest {
  uint256 initialReleaseGoldAmount;

  function setUp() public {
    super.setUp();

    initParams2.initialDistributionRatio = 0;
    initialReleaseGoldAmount = initParams.amountReleasedPerPeriod * initParams.numReleasePeriods;
    newReleaseGold(true, false);
  }

  function test_ShouldRevertBeforeTheReleaseCliffHasPassed() public {
    vm.prank(releaseOwner);
    releaseGold.setMaxDistribution(1000);
    vm.warp(block.timestamp + 30 * MINUTE);
    vm.expectRevert("Requested amount is greater than available released funds");
    vm.prank(beneficiary);
    releaseGold.withdraw(initialReleaseGoldAmount / 20);
  }

  function test_ShouldRevertWhenWithdrawableAmountIsZero() public {
    vm.prank(releaseOwner);
    releaseGold.setMaxDistribution(1000);
    vm.warp(block.timestamp + 3 * MONTH + 1 * DAY);
    vm.expectRevert("Requested withdrawal amount must be greater than zero");
    vm.prank(beneficiary);
    releaseGold.withdraw(0);
  }

  function test_ShouldRevertSinceBeneficiaryShouldNotBeABleToWithdrawAnythingWIthingTheFirstQuarter_WhenNotRevoked_WhenMaxDistributionIs100Percent()
    public
  {
    vm.prank(releaseOwner);
    releaseGold.setMaxDistribution(1000);

    uint256 beneficiaryBalanceBefore = goldToken.balanceOf(initParams._beneficiary);
    vm.warp(block.timestamp + 3 * 29 * DAY);
    uint256 expectedWithdrawalAmount = releaseGold.getCurrentReleasedTotalAmount();

    vm.expectRevert("Requested withdrawal amount must be greater than zero");
    vm.prank(beneficiary);
    releaseGold.withdraw(expectedWithdrawalAmount);

    uint256 beneficiaryBalanceAfter = goldToken.balanceOf(initParams._beneficiary);
    assertEq(beneficiaryBalanceAfter - beneficiaryBalanceBefore, 0);
  }

  function test_ShouldAllowBeneficiaryToWithdraw25PercentAFterTheFirstQuarter_WhenNotRevoked_WhenMaxDistributionIs100Percent()
    public
  {
    vm.prank(releaseOwner);
    releaseGold.setMaxDistribution(1000);

    uint256 beneficiaryBalanceBefore = goldToken.balanceOf(initParams._beneficiary);
    vm.warp(block.timestamp + 3 * MONTH + 1 * DAY);
    uint256 expectedWithdrawalAmount = initialReleaseGoldAmount / 4;

    vm.prank(beneficiary);
    releaseGold.withdraw(expectedWithdrawalAmount);

    assertEq(expectedWithdrawalAmount, releaseGold.totalWithdrawn(), "Incorrect withdrawalAmount");

    uint256 beneficiaryBalanceAfter = goldToken.balanceOf(initParams._beneficiary);
    assertEq(beneficiaryBalanceAfter - beneficiaryBalanceBefore, expectedWithdrawalAmount);
  }

  function test_ShouldAllowBeneficiaryToWithdraw50PercentAFterTheSecondQuarter_WhenNotRevoked_WhenMaxDistributionIs100Percent()
    public
  {
    vm.prank(releaseOwner);
    releaseGold.setMaxDistribution(1000);

    uint256 beneficiaryBalanceBefore = goldToken.balanceOf(initParams._beneficiary);
    vm.warp(block.timestamp + 6 * MONTH + 1 * DAY);
    uint256 expectedWithdrawalAmount = initialReleaseGoldAmount / 2;

    vm.prank(beneficiary);
    releaseGold.withdraw(expectedWithdrawalAmount);

    assertEq(expectedWithdrawalAmount, releaseGold.totalWithdrawn(), "Incorrect withdrawalAmount");

    uint256 beneficiaryBalanceAfter = goldToken.balanceOf(initParams._beneficiary);
    assertEq(beneficiaryBalanceAfter - beneficiaryBalanceBefore, expectedWithdrawalAmount);
  }

  function test_ShouldAllowBeneficiaryToWithdraw75PercentAFterTheThirdQuarter_WhenNotRevoked_WhenMaxDistributionIs100Percent()
    public
  {
    vm.prank(releaseOwner);
    releaseGold.setMaxDistribution(1000);

    uint256 beneficiaryBalanceBefore = goldToken.balanceOf(initParams._beneficiary);
    vm.warp(block.timestamp + 9 * MONTH + 1 * DAY);
    uint256 expectedWithdrawalAmount = (initialReleaseGoldAmount / 4) * 3;

    vm.prank(beneficiary);
    releaseGold.withdraw(expectedWithdrawalAmount);

    assertEq(expectedWithdrawalAmount, releaseGold.totalWithdrawn(), "Incorrect withdrawalAmount");

    uint256 beneficiaryBalanceAfter = goldToken.balanceOf(initParams._beneficiary);
    assertEq(beneficiaryBalanceAfter - beneficiaryBalanceBefore, expectedWithdrawalAmount);
  }

  function test_ShouldAllowBeneficiaryToWithdraw100PercentAFterTheFourthQuarter_WhenNotRevoked_WhenMaxDistributionIs100Percent()
    public
  {
    vm.prank(releaseOwner);
    releaseGold.setMaxDistribution(1000);

    uint256 beneficiaryBalanceBefore = goldToken.balanceOf(initParams._beneficiary);
    vm.warp(block.timestamp + 12 * MONTH + 1 * DAY);
    uint256 expectedWithdrawalAmount = initialReleaseGoldAmount;

    vm.prank(beneficiary);
    releaseGold.withdraw(expectedWithdrawalAmount);

    assertEq(expectedWithdrawalAmount, releaseGold.totalWithdrawn(), "Incorrect withdrawalAmount");

    uint256 beneficiaryBalanceAfter = goldToken.balanceOf(initParams._beneficiary);
    assertEq(beneficiaryBalanceAfter - beneficiaryBalanceBefore, expectedWithdrawalAmount);
  }

  function test_ShouldAllowDistributionOfInitialBalanceAndRewards_WhenTheGrantHasFullyReleased_WhenRewardsAreSimulated__WhenNotRevoked_WhenMaxDistributionIs100Percent()
    public
  {
    vm.prank(releaseOwner);
    releaseGold.setMaxDistribution(1000);

    vm.prank(randomAddress);
    goldToken.transfer(address(releaseGold), 1 ether / 2);
    vm.warp(block.timestamp + 12 * MONTH + 1 * DAY);

    uint256 expectedWIthdrawalAmount = TOTAL_AMOUNT + 1 ether / 2;
    vm.prank(beneficiary);
    releaseGold.withdraw(expectedWIthdrawalAmount);
  }

  function test_ShouldAllowDistributionOfHalfInitialBalanceAndHalfRewards_WhenTheGrantIsHalfwayReleased_WhenRewardsAreSimulated_WhenNotRevoked_WhenMaxDistributionIs100Percent()
    public
  {
    vm.prank(releaseOwner);
    releaseGold.setMaxDistribution(1000);

    vm.prank(randomAddress);
    goldToken.transfer(address(releaseGold), 1 ether / 2);
    vm.warp(block.timestamp + 6 * MONTH + 1 * DAY);

    uint256 expectedWIthdrawalAmount = (TOTAL_AMOUNT + 1 ether / 2) / 2;
    vm.prank(beneficiary);
    releaseGold.withdraw(expectedWIthdrawalAmount);
  }

  function test_ShouldRevertWhenRequestingMoreThanHalf_WhenTheGrantIsHalfwayReleased_WhenRewardsAreSimulated_WhenNotRevoked_WhenMaxDistributionIs100Percent()
    public
  {
    vm.prank(releaseOwner);
    releaseGold.setMaxDistribution(1000);

    vm.prank(randomAddress);
    goldToken.transfer(address(releaseGold), 1 ether / 2);
    vm.warp(block.timestamp + 6 * MONTH + 1 * DAY);

    uint256 expectedWIthdrawalAmount = (TOTAL_AMOUNT + 1 ether / 2) / 2 + 1;
    vm.prank(beneficiary);
    vm.expectRevert("Requested amount is greater than available released funds");
    releaseGold.withdraw(expectedWIthdrawalAmount);
  }

  function test_ShouldRevertWhenWithdrawingMoreThan50Percent_WhenTheGrantHasFullyReleased_WhenRewardsAreSimulated__WhenNotRevoked_WhenMaxDistributionIs50Percent()
    public
  {
    vm.prank(releaseOwner);
    releaseGold.setMaxDistribution(500);

    vm.prank(randomAddress);
    // Simulate rewards of 0.5 Gold
    // Have to send after setting max distribution
    goldToken.transfer(address(releaseGold), 1 ether / 2);
    vm.warp(block.timestamp + 12 * MONTH + 1 * DAY);

    uint256 expectedWIthdrawalAmount = TOTAL_AMOUNT / 2;
    vm.prank(beneficiary);
    releaseGold.withdraw(expectedWIthdrawalAmount);

    uint256 unexpectedWIthdrawalAmount = 1;
    vm.prank(beneficiary);
    vm.expectRevert("Requested amount exceeds current alloted maximum distribution");
    releaseGold.withdraw(unexpectedWIthdrawalAmount);
  }

  function test_ShouldAllowTheBEneficiaryToWithdrawUpToTheReleasedBalanceAtRevoke_WhenMaxDistributionIs100Percent_WhenRevoked()
    public
  {
    vm.prank(releaseOwner);
    releaseGold.setMaxDistribution(1000);

    uint256 beneficiaryBalanceBefore = goldToken.balanceOf(initParams._beneficiary);
    vm.warp(block.timestamp + 6 * MONTH + 1 * DAY);
    vm.prank(releaseOwner);
    releaseGold.revoke();
    (, , uint256 expectedWithdrawalAmount, ) = releaseGold.revocationInfo();
    vm.prank(beneficiary);
    releaseGold.withdraw(expectedWithdrawalAmount);
    uint256 totalWithdrawn = releaseGold.totalWithdrawn();
    uint256 beneficiaryBalanceAfter = goldToken.balanceOf(initParams._beneficiary);

    assertEq(totalWithdrawn, expectedWithdrawalAmount);
    assertEq(beneficiaryBalanceAfter - beneficiaryBalanceBefore, expectedWithdrawalAmount);
  }

  function test_ShouldRevertIfBeneficiaryAttemptsToWitdrawMOreThanReleasedBAlanceAtRevoke_WhenMaxDistributionIs100Percent_WhenRevoked()
    public
  {
    vm.prank(releaseOwner);
    releaseGold.setMaxDistribution(1000);

    vm.warp(block.timestamp + 6 * MONTH + 1 * DAY);
    vm.prank(releaseOwner);
    releaseGold.revoke();

    (, , uint256 expectedWithdrawalAmount, ) = releaseGold.revocationInfo();
    vm.expectRevert("Requested amount is greater than available released funds");
    vm.prank(beneficiary);
    releaseGold.withdraw(expectedWithdrawalAmount + 1);
  }

  function test_ShouldAllowWithdrawalOf50Percent_WhenMaxDistributionIs50Percent_WhenMaxDistributionIsSetLower()
    public
  {
    vm.prank(releaseOwner);
    releaseGold.setMaxDistribution(500);

    uint256 beneficiaryBalanceBefore = goldToken.balanceOf(initParams._beneficiary);
    vm.warp(block.timestamp + 12 * MONTH + 1 * DAY);
    uint256 expectedWithdrawalAmount = initialReleaseGoldAmount / 2;

    vm.prank(beneficiary);
    releaseGold.withdraw(expectedWithdrawalAmount);

    assertEq(expectedWithdrawalAmount, releaseGold.totalWithdrawn(), "Incorrect withdrawalAmount");

    uint256 beneficiaryBalanceAfter = goldToken.balanceOf(initParams._beneficiary);
    assertEq(beneficiaryBalanceAfter - beneficiaryBalanceBefore, expectedWithdrawalAmount);
  }

  function test_ShouldRevertWhenWithdrawingMoreThan50Percent_WhenMaxDistributionIs50Percent_WhenMaxDistributionIsSetLower()
    public
  {
    vm.prank(releaseOwner);
    releaseGold.setMaxDistribution(500);

    vm.warp(block.timestamp + 12 * MONTH + 1 * DAY);
    uint256 expectedWithdrawalAmount = initialReleaseGoldAmount / 2 + 1;

    vm.expectRevert("Requested amount exceeds current alloted maximum distribution");
    vm.prank(beneficiary);
    releaseGold.withdraw(expectedWithdrawalAmount);
  }

  function test_ShouldAllowWithdrawalOf100Percent_WhenMaxDistributionIs100Percent_WhenMaxDistributionIsSetLower()
    public
  {
    vm.prank(releaseOwner);
    releaseGold.setMaxDistribution(1000);

    uint256 beneficiaryBalanceBefore = goldToken.balanceOf(initParams._beneficiary);
    vm.warp(block.timestamp + 12 * MONTH + 1 * DAY);
    uint256 expectedWithdrawalAmount = initialReleaseGoldAmount;

    vm.prank(beneficiary);
    releaseGold.withdraw(expectedWithdrawalAmount);

    assertEq(expectedWithdrawalAmount, releaseGold.totalWithdrawn(), "Incorrect withdrawalAmount");

    uint256 beneficiaryBalanceAfter = goldToken.balanceOf(initParams._beneficiary);
    assertEq(beneficiaryBalanceAfter - beneficiaryBalanceBefore, expectedWithdrawalAmount);
  }

  function test_ShouldRevertOnWithdrawalOfAnyAmount_WhenLiquidityProvisionIsObservedAndSetFalse()
    public
  {
    initParams2.subjectToLiquidityProvision = true;
    newReleaseGold(true, false);
    vm.warp(block.timestamp + 12 * MONTH + 1 * DAY);

    vm.expectRevert("Requested withdrawal before liquidity provision is met");
    vm.prank(beneficiary);
    releaseGold.withdraw(initialReleaseGoldAmount);

    vm.expectRevert("Requested withdrawal before liquidity provision is met");
    vm.prank(beneficiary);
    releaseGold.withdraw(initialReleaseGoldAmount / 2);
  }
}

contract ReleaseGoldTest_WithdrawSelfDestruct_WhenNotRevoked is ReleaseGoldTest {
  uint256 initialReleaseGoldAmount;

  function setUp() public {
    super.setUp();

    initParams2.initialDistributionRatio = 0;
    initialReleaseGoldAmount = initParams.amountReleasedPerPeriod * initParams.numReleasePeriods;
    newReleaseGold(true, false);

    vm.prank(releaseOwner);
    releaseGold.setMaxDistribution(1000);

    vm.warp(block.timestamp + 12 * MONTH + 1 * DAY);
    uint256 expectedWithdrawalAmount = initialReleaseGoldAmount;

    vm.prank(beneficiary);
    releaseGold.withdraw(expectedWithdrawalAmount);
  }

  function test_ShouldSelfDestructIfBeneficiaryWithdrawsTheEntireAmount() public {
    vm.expectRevert();
    releaseGold.totalWithdrawn();
  }
}

contract ReleaseGoldTest_WithdrawSelfDestruct_WhenRevoked is ReleaseGoldTest {
  uint256 initialReleaseGoldAmount;

  function setUp() public {
    super.setUp();

    initParams2.initialDistributionRatio = 0;
    initialReleaseGoldAmount = initParams.amountReleasedPerPeriod * initParams.numReleasePeriods;
    newReleaseGold(true, false);

    vm.prank(releaseOwner);
    releaseGold.setMaxDistribution(1000);

    vm.warp(block.timestamp + 12 * MONTH + 1 * DAY);
    vm.prank(releaseOwner);
    releaseGold.revoke();

    (, , uint256 expectedWithdrawalAmount, ) = releaseGold.revocationInfo();
    vm.prank(beneficiary);
    releaseGold.withdraw(expectedWithdrawalAmount);
  }

  function test_ShouldSelfDestructIfBeneficiaryWithdrawsTheEntireAmount() public {
    vm.expectRevert();
    releaseGold.totalWithdrawn();
  }
}

contract ReleaseGoldTest_GetCurrentReleasedTotalAmount is ReleaseGoldTest {
  uint256 initialReleaseGoldAmount;

  function setUp() public {
    super.setUp();
    newReleaseGold(true, false);
    initialReleaseGoldAmount = initParams.amountReleasedPerPeriod * initParams.numReleasePeriods;
  }

  function test_ShouldReturnZeroIfBeforeCliffStartTime() public {
    vm.warp(block.timestamp + 1);
    assertEq(releaseGold.getCurrentReleasedTotalAmount(), 0);
  }

  function test_ShouldReturn25PercentOfReleasedAmountOfGoldRightAfterTheBeginningOfTheFirstQuarter()
    public
  {
    vm.warp(block.timestamp + 3 * MONTH + 1 * DAY);
    assertEq(releaseGold.getCurrentReleasedTotalAmount(), initialReleaseGoldAmount / 4);
  }

  function test_ShouldReturn50PercentOfReleasedAmountOfGoldRightAfterTheBeginningOfTheSecondQuarter()
    public
  {
    vm.warp(block.timestamp + 6 * MONTH + 1 * DAY);
    assertEq(releaseGold.getCurrentReleasedTotalAmount(), initialReleaseGoldAmount / 2);
  }

  function test_ShouldReturn75PercentOfReleasedAmountOfGoldRightAfterTheBeginningOfTheThirdQuarter()
    public
  {
    vm.warp(block.timestamp + 9 * MONTH + 1 * DAY);
    assertEq(releaseGold.getCurrentReleasedTotalAmount(), (initialReleaseGoldAmount / 4) * 3);
  }

  function test_ShouldReturn100PercentOfReleasedAmountOfGoldRightAfterTheBeginningOfTheFourthQuarter()
    public
  {
    vm.warp(block.timestamp + 12 * MONTH + 1 * DAY);
    assertEq(releaseGold.getCurrentReleasedTotalAmount(), initialReleaseGoldAmount);
  }
}

contract ReleaseGoldTest_GetWithdrawableAmount is ReleaseGoldTest {
  uint256 initialReleaseGoldAmount;

  function setUp() public {
    super.setUp();
    initParams2._canValidate = true;
    initParams.revocable = false;
    initParams2._refundAddress = address(0);
    initParams2.initialDistributionRatio = 500;

    newReleaseGold(true, false);
    initialReleaseGoldAmount = initParams.amountReleasedPerPeriod * initParams.numReleasePeriods;
  }

  function test_ShouldReturnFullAmountAvailableForThisReleasePeriod() public {
    vm.prank(releaseOwner);
    releaseGold.setMaxDistribution(1000);

    vm.warp(block.timestamp + 6 * MONTH + 1 * DAY);
    assertEq(releaseGold.getWithdrawableAmount(), initialReleaseGoldAmount / 2);
  }

  function test_ShouldReturnOnlyAmountNotYetWithdrawn() public {
    vm.prank(releaseOwner);
    releaseGold.setMaxDistribution(1000);

    vm.warp(block.timestamp + 6 * MONTH + 1 * DAY);
    vm.prank(beneficiary);
    releaseGold.withdraw(initialReleaseGoldAmount / 4);
    assertEq(releaseGold.getWithdrawableAmount(), initialReleaseGoldAmount / 4);
  }

  function test_ShouldReturnOnlyUpToItsOwnBalanceWhenValidatorSignerAuthorizedWitoutKey() public {
    vm.prank(releaseOwner);
    releaseGold.setMaxDistribution(1000);

    vm.prank(beneficiary);
    releaseGold.createAccount();

    vm.warp(block.timestamp + 6 * MONTH + 1 * DAY);

    uint256 signerFund = 1 ether;
    uint256 expectedWithdrawalAmount = (initialReleaseGoldAmount - signerFund) / 2;

    (address authorized, uint256 authorizedPK) = actorWithPK("authorized");
    (uint8 v, bytes32 r, bytes32 s) = getParsedSignatureOfAddress(
      address(releaseGold),
      authorizedPK
    );

    vm.prank(beneficiary);
    releaseGold.authorizeValidatorSigner(address(uint160(authorized)), v, r, s);

    assertEq(releaseGold.getWithdrawableAmount(), expectedWithdrawalAmount);
  }

  function test_ShouldReturnOnlyUpToItsOwnBalanceWhenValidatorSignerAuthorizedWithPublicKey()
    public
  {
    vm.prank(releaseOwner);
    releaseGold.setMaxDistribution(1000);

    vm.prank(beneficiary);
    releaseGold.createAccount();

    vm.warp(block.timestamp + 6 * MONTH + 1 * DAY);

    uint256 signerFund = 1 ether;
    uint256 expectedWithdrawalAmount = (initialReleaseGoldAmount - signerFund) / 2;

    (address authorized, uint256 authorizedPK) = actorWithPK("authorized");
    (uint8 v, bytes32 r, bytes32 s) = getParsedSignatureOfAddress(
      address(releaseGold),
      authorizedPK
    );
    bytes memory ecdsaPublicKey = addressToPublicKey(
      keccak256(abi.encodePacked("dummy_msg_data")),
      v,
      r,
      s
    );

    vm.prank(beneficiary);
    releaseGold.authorizeValidatorSignerWithPublicKey(
      address(uint160(authorized)),
      v,
      r,
      s,
      ecdsaPublicKey
    );

    assertEq(releaseGold.getWithdrawableAmount(), expectedWithdrawalAmount);
  }

  function test_ShouldReturnOnlyUpToMaxDistribution() public {
    vm.prank(releaseOwner);
    releaseGold.setMaxDistribution(250);

    vm.warp(block.timestamp + 6 * MONTH + 1 * DAY);
    assertEq(releaseGold.getWithdrawableAmount(), initialReleaseGoldAmount / 4);
  }
}

contract ReleaseGoldTest_DeployAndInitializeOnL2 is ReleaseGoldTest {
  uint256 public maxUint256 = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF;
  function setUp() public {
    super.setUp();
    _whenL2();
    initParams2.registryAddress = proxyAdminAddress;
  }

  function test_ShouldIndicateIsFundedIfDeploymentIsPrefunded() public {
    newReleaseGold(true, false);
    assertTrue(releaseGold.isFunded());
  }

  function test_ShouldNotIndicateFundedAndNotRevertIfDeploymentIsNotPrefunded() public {
    newReleaseGold(false, false);
    assertFalse(releaseGold.isFunded());
  }

  function test_ShouldHaveAssociatedFundsWithAScheduleUponCreation() public {
    newReleaseGold(true, false);
    assertEq(
      goldToken.balanceOf(address(releaseGold)),
      initParams.numReleasePeriods * initParams.amountReleasedPerPeriod
    );
  }

  function test_ShouldSetABeneficiaryToReleaseGoldInstance() public {
    newReleaseGold(true, false);
    assertEq(releaseGold.beneficiary(), initParams._beneficiary);
  }

  function test_ShouldSetAReleaseOwnerToReleaseGoldInstance() public {
    newReleaseGold(true, false);
    assertEq(releaseGold.releaseOwner(), initParams2._releaseOwner);
  }

  function test_ShouldSetReleaseGoldNumberOfPeriods() public {
    newReleaseGold(true, false);
    (, , uint256 releaseGoldNumPeriods, , ) = releaseGold.releaseSchedule();
    assertEq(releaseGoldNumPeriods, initParams.numReleasePeriods);
  }

  function test_ShouldSetReleaseGoldAmountPerPeriod() public {
    newReleaseGold(true, false);
    (, , , , uint256 releaseGoldAmountPerPeriod) = releaseGold.releaseSchedule();
    assertEq(releaseGoldAmountPerPeriod, initParams.amountReleasedPerPeriod);
  }

  function test_ShouldSetReleaseGoldPeriod() public {
    newReleaseGold(true, false);
    (, , , uint256 releaseGoldPeriod, ) = releaseGold.releaseSchedule();
    assertEq(releaseGoldPeriod, initParams.releasePeriod);
  }

  function test_ShouldSetReleaseGoldStartTime() public {
    newReleaseGold(true, false);
    (uint256 releaseGoldStartTime, , , , ) = releaseGold.releaseSchedule();
    assertEq(releaseGoldStartTime, initParams.releaseStartTime);
  }

  function test_ShouldSetReleaseGoldCliffTime() public {
    newReleaseGold(true, false);
    (, uint256 releaseGoldCliffTime, , , ) = releaseGold.releaseSchedule();
    uint256 expectedCliffTime = initParams.releaseStartTime + initParams.releaseCliffTime;
    assertEq(releaseGoldCliffTime, expectedCliffTime);
  }

  function test_ShouldSetRevocableFlagToReleaseGoldInstance() public {
    newReleaseGold(true, false);
    (bool revocable, , , ) = releaseGold.revocationInfo();
    assertEq(revocable, initParams.revocable);
  }

  function test_ShouldSetReleaseOwnerToReleaseGoldInstance() public {
    newReleaseGold(true, false);
    assertEq(releaseGold.releaseOwner(), initParams2._releaseOwner);
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
    releaseGold = new ReleaseGold(true);
    initParams._beneficiary = address(0);
    ReleaseGoldMockTunnel tunnel = new ReleaseGoldMockTunnel(address(releaseGold));
    vm.expectRevert("unsuccessful tunnel call");
    tunnel.MockInitialize(owner, initParams, initParams2);
  }

  function test_ShouldRevertWhenReleaseGoldPeriodsAreZero() public {
    releaseGold2 = new ReleaseGold(true);
    initParams.numReleasePeriods = 0;
    ReleaseGoldMockTunnel tunnel = new ReleaseGoldMockTunnel(address(releaseGold2));
    vm.expectRevert("unsuccessful tunnel call");
    tunnel.MockInitialize(owner, initParams, initParams2);
  }

  function test_ShouldRevertWhenReleasedAmountPerPeriodIsZero() public {
    releaseGold2 = new ReleaseGold(true);
    initParams.amountReleasedPerPeriod = 0;
    ReleaseGoldMockTunnel tunnel = new ReleaseGoldMockTunnel(address(releaseGold2));
    vm.expectRevert("unsuccessful tunnel call");
    tunnel.MockInitialize(owner, initParams, initParams2);
  }

  function test_ShouldOverflowForVeryLargeCombinationsOdReleasePeriodsAndAmountPerTime() public {
    releaseGold = new ReleaseGold(true);
    initParams.numReleasePeriods = maxUint256;
    initParams.amountReleasedPerPeriod = maxUint256;
    initParams2.initialDistributionRatio = 999;
    ReleaseGoldMockTunnel tunnel = new ReleaseGoldMockTunnel(address(releaseGold));
    vm.expectRevert("unsuccessful tunnel call");
    tunnel.MockInitialize(owner, initParams, initParams2);
  }
}
