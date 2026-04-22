// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

// Foundry imports
import { console2 } from "forge-std-8/console2.sol";
import { stdJson } from "forge-std-8/StdJson.sol";

// OpenZeppelin imports
import { Ownable } from "@openzeppelin/contracts8/access/Ownable.sol";

// Governance
import { IGovernance } from "@celo-contracts/governance/interfaces/IGovernance.sol";
import { IGovernanceVote } from "@celo-contracts/governance/interfaces/IGovernanceVote.sol";
import { IGovernanceSlasher } from "@celo-contracts/governance/interfaces/IGovernanceSlasher.sol";

// Common imports
import { IMultiSig } from "@celo-contracts/common/interfaces/IMultiSig.sol";
import { IRegistry } from "@celo-contracts/common/interfaces/IRegistry.sol";

// Test imports
import { Devchain } from "@test-sol/devchain/e2e/utils.sol";
import { ConstitutionHelper } from "@test-sol/utils/ConstitutionHelper.sol";

// Wrapper interface for Governance functions not in IGovernance (different Solidity version)
interface IGovernanceExtended {
  function dequeueProposalsIfReady() external;
  function concurrentProposals() external view returns (uint256);
}

contract E2E_Election is Devchain {
  function test_shouldElectAllValidators() public {
    // elect all validators
    address[] memory allValidators_ = election.electValidatorSigners();

    // assert there are 6 validators
    assertEq(allValidators_.length, 6);
  }

  function test_shouldElectSpecifiedValidators() public {
    // elect between 1 and 4 validators (out of 6 total)
    address[] memory selectedValidators_ = election.electNValidatorSigners(1, 4);

    // assert there are 4 validators
    assertEq(selectedValidators_.length, 4);
  }
}

contract E2E_Constitution is Devchain {
  // test cases
  ConstitutionHelper.ConstitutionEntry[] internal constitutionCases;
  ConstitutionHelper.ConstitutionEntry internal currentCase;

  // event for transparency
  event LogConstitutionCase(ConstitutionHelper.ConstitutionEntry);

  // snapshot
  uint256 internal constitutionSnapshot;

  // parametrization
  modifier parametrized__constitutionCase() {
    for (uint256 i = 0; i < constitutionCases.length; i++) {
      currentCase = constitutionCases[i];
      if (constitutionSnapshot == 0) constitutionSnapshot = vm.snapshot();
      _;
      vm.revertTo(constitutionSnapshot);
    }
  }

  function setUp() public virtual override {
    // read constitution
    ConstitutionHelper.readConstitution(constitutionCases, registryContract, vm);
  }

  function test_shouldHaveCorrectThreshold() public parametrized__constitutionCase {
    emit LogConstitutionCase(currentCase);
    assertEq(
      governance.getConstitution(currentCase.contractAddress, currentCase.functionSelector),
      currentCase.threshold
    );
  }
}

contract E2E_GovernanceBase is Devchain {
  using stdJson for string;

  // config
  address internal ownerAddress = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266;
  uint256 internal minDeposit;
  uint256 internal dequeueFrequency;
  uint256 internal approvalDuration;
  uint256 internal referendumDuration;

  // test vars
  address internal tester = actor("e2e");
  uint256 internal locked;
  uint256 internal proposalId = 1;
  uint256 internal dequeueIndex = 0;

  function setUp() public virtual override {
    // setup config
    string memory config_ = vm.readFile("./migrations_sol/migrationsConfig.json");
    minDeposit = config_.readUint(".governance.minDeposit");
    dequeueFrequency = config_.readUint(".governance.dequeueFrequency");
    approvalDuration = config_.readUint(".governance.approvalStageDuration");
    referendumDuration = config_.readUint(".governance.referendumStageDuration");

    Ownable registryContractOwnable = Ownable(address(registryContract));

    // transfer out ownership to governance
    vm.prank(registryContractOwnable.owner());
    registryContractOwnable.transferOwnership(address(governance));

    // setup tester account
    vm.deal(tester, 10_000_001 ether + minDeposit);
    vm.startPrank(tester);
    accounts.createAccount();
    lockedCelo.lock{ value: 10_000_000 ether }();
    vm.stopPrank();

    // retrieve locked celo
    locked = lockedCelo.getAccountTotalLockedGold(tester);
  }

  function _propose() public virtual {
    uint256[] memory values_ = new uint256[](2);
    values_[0] = 0;
    values_[1] = 0;

    // setup destinations
    address[] memory destinations_ = new address[](2);
    destinations_[0] = registryAddress;
    destinations_[1] = registryAddress;

    // setup data
    bytes[] memory data_ = new bytes[](2);
    data_[0] = abi.encodeWithSelector(IRegistry.setAddressFor.selector, "test1", address(11));
    data_[1] = abi.encodeWithSelector(IRegistry.setAddressFor.selector, "test2", address(12));

    // setup data lengths
    uint256[] memory dataLengths_ = new uint256[](2);
    dataLengths_[0] = data_[0].length;
    dataLengths_[1] = data_[1].length;

    // propose
    vm.prank(tester);
    governance.propose{ value: minDeposit }(
      values_,
      destinations_,
      abi.encodePacked(data_[0], data_[1]),
      dataLengths_,
      "url"
    );
  }

  function _upvoteProposal(uint256 proposalId, uint256 lesser, uint256 greater) public {
    vm.prank(tester);
    governance.upvote(proposalId, lesser, greater);
  }

  function _approveProposal() public {
    timeTravel(dequeueFrequency);
    blockTravel(1);

    // submit tx from multisig
    address multisig_ = registryContract.getAddressForString("GovernanceApproverMultiSig");
    vm.prank(ownerAddress);
    IMultiSig(multisig_).submitTransaction(
      address(governance),
      0, // value
      abi.encodeWithSelector(IGovernance.approve.selector, proposalId, dequeueIndex)
    );
  }

  function _vote() public {
    // increase time and mine 1 block
    timeTravel(approvalDuration);
    blockTravel(1);

    // vote
    vm.prank(tester);
    IGovernanceVote(address(governance)).vote(
      proposalId,
      dequeueIndex,
      IGovernanceVote.VoteValue.Yes
    );
  }
}
contract E2E_Governance is E2E_GovernanceBase {
  function test_shouldIncrementProposalCount() public virtual {
    // setup values
    _propose();
    assertEq(governance.proposalCount(), proposalId, "proposal should be the first");
  }

  function test_shouldUpvoteProposal() public {
    // first three are dequeued automatically
    // TODO use concurrentProposals
    for (uint256 i = 0; i < 4; i++) {
      vm.deal(tester, minDeposit);
      _propose();
    }

    console2.log(
      "concurrentProposals:",
      IGovernanceExtended(address(governance)).concurrentProposals()
    );

    // if a proposal is dequeuable, upvote will fail because it will try to dequeue it first
    // that's the reason we need to dequeue the max first
    // upvote
    _upvoteProposal(
      4,
      3, // lesser
      0 // greater
    );

    assertEq(governance.getUpvotes(4), locked);
    assertGt(locked, 0);
  }

  function test_shouldApproveProposal() public {
    _propose();
    _approveProposal();

    assertTrue(governance.isApproved(proposalId));
  }

  function test_shouldIncrementVoteTotals() public {
    _propose();
    _vote();
    (uint256 yesVotes, , ) = governance.getVoteTotals(proposalId);
    assertEq(yesVotes, locked);
  }

  function test_shouldExecuteProposal() public virtual {
    _propose();
    _approveProposal();
    _vote();

    // increase time and mine 1 block
    timeTravel(referendumDuration);
    blockTravel(1);

    // execute
    vm.prank(tester);
    governance.execute(proposalId, dequeueIndex);

    // assert
    assertEq(registryContract.getAddressForStringOrDie("test1"), address(11));
    assertEq(registryContract.getAddressForStringOrDie("test2"), address(12));
  }
}

// TODO: Altough not present in Truffle integration tests -> to fully test GovernanceSlasher it would be great to add:
// TODO: - test case for account that already voted some of his locked celo (slashing requires revoking votes)
// TODO: - test case for a validator account that is a member of a validator group (group additionally gets slashed)
contract E2E_GovernanceSlashing is E2E_Governance {
  // test vars
  IGovernanceSlasher internal governanceSlasher;
  address internal slashed = actor("slashed");
  uint256 internal penalty = 10_000_000 ether;

  function setUp() public virtual override {
    super.setUp();

    // get slasher
    governanceSlasher = IGovernanceSlasher(
      registryContract.getAddressForOrDie(GOVERNANCE_SLASHER_REGISTRY_ID)
    );

    // transfer out ownership to governance
    address owner_ = Ownable(address(governanceSlasher)).owner();
    address governanceSlasherAddress = address(governanceSlasher);
    address governanceAddress = address(governance);
    Ownable governanceSlasherOwnable = Ownable(governanceSlasherAddress);

    vm.prank(owner_);
    governanceSlasherOwnable.transferOwnership(governanceAddress);

    // setup slashed account
    vm.deal(slashed, penalty + 1 ether);
    vm.startPrank(slashed);
    accounts.createAccount();
    lockedCelo.lock{ value: penalty }();
    vm.stopPrank();
  }

  function _propose() public override {
    // setup values
    uint256[] memory values_ = new uint256[](2);
    values_[0] = 0;
    values_[1] = 0;

    // setup destinations
    address[] memory destinations_ = new address[](2);
    destinations_[0] = address(governanceSlasher);
    destinations_[1] = address(governanceSlasher);

    // setup data
    bytes[] memory data_ = new bytes[](2);
    data_[0] = abi.encodeWithSelector(
      IGovernanceSlasher.approveSlashing.selector,
      slashed,
      penalty
    );
    data_[1] = abi.encodeWithSelector(IGovernanceSlasher.setSlasherExecuter.selector, tester);

    // setup data lengths
    uint256[] memory dataLengths_ = new uint256[](2);
    dataLengths_[0] = data_[0].length;
    dataLengths_[1] = data_[1].length;

    // propose
    vm.prank(tester);
    governance.propose{ value: minDeposit }(
      values_,
      destinations_,
      abi.encodePacked(data_[0], data_[1]),
      dataLengths_,
      "url"
    );
  }

  function _passProposal() public {
    _propose();
    _approveProposal();
    _vote();

    // increase time and mine 1 block
    timeTravel(referendumDuration);
    blockTravel(1);

    // execute
    vm.prank(tester);
    governance.execute(proposalId, dequeueIndex);
  }

  function test_shouldExecuteProposal() public virtual override {
    _passProposal();
    // assert
    assertEq(governanceSlasher.getApprovedSlashing(slashed), penalty);
  }

  function _slash() internal {
    _passProposal();
    // increase time and mine 1 block
    timeTravel(referendumDuration);
    blockTravel(1);

    // slash
    address group_ = address(0);
    address[] memory lessers_;
    address[] memory greaters_;
    uint256[] memory indices_;
    vm.prank(tester);
    governanceSlasher.slash(slashed, group_, lessers_, greaters_, indices_);
  }

  function test_shouldSetApprovedSlashingZero() public {
    _slash();

    // should set approved slashing value to 0
    assertEq(governanceSlasher.getApprovedSlashing(slashed), 0);
  }

  function test_shouldSlashAccount() public {
    _slash();

    // whole locked celo should be slashed
    assertEq(lockedCelo.getAccountTotalLockedGold(slashed), 0);
  }
}
