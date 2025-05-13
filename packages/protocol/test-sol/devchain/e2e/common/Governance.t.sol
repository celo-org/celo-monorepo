// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

// Foundry imports
import { console } from "forge-std-8/console.sol";
import { stdJson } from "forge-std-8/StdJson.sol";

// OpenZeppelin imports
import { Ownable } from "@openzeppelin/contracts8/access/Ownable.sol";

// Governance
import { IGovernance } from "@celo-contracts/governance/interfaces/IGovernance.sol";
import { IGovernanceVote } from "@celo-contracts/governance/interfaces/IGovernanceVote.sol";
import { IGovernanceSlasher } from "@celo-contracts/governance/interfaces/IGovernanceSlasher.sol";

// Common imports
import { StringUtils } from "@celo-contracts/common/libraries/StringUtils.sol";
import { SelectorParser } from "@celo-contracts/common/test/SelectorParser.sol";
import { IMultiSig } from "@celo-contracts/common/interfaces/IMultiSig.sol";
import { IRegistry } from "@celo-contracts/common/interfaces/IRegistry.sol";

// Test imports
import { Devchain } from "@test-sol/devchain/e2e/utils.sol";

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
  using stdJson for string;
  using StringUtils for string;
  using SelectorParser for string;

  // test cases
  struct ConstitutionCase {
    string contractName;
    address contractAddress;
    string functionName;
    bytes4 selector;
    uint256 threshold;
  }
  ConstitutionCase[] internal constitutionCases;
  ConstitutionCase internal currentCase;

  // event for transparency
  event LogConstitutionCase(ConstitutionCase);

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
    // get contracts from constitution
    string memory constitutionJson_ = vm.readFile("./governanceConstitution.json");
    string[] memory contractNames_ = vm.parseJsonKeys(constitutionJson_, "");

    // vars for looping
    string memory contractName_;
    address address_;
    string memory functionName_;
    bytes4 selector_;
    uint256 threshold_;
    string memory selectorJson_;
    string[] memory functionsWithTypes_;
    string[] memory functionNames_;

    // loop over contract names
    for (uint256 i = 0; i < contractNames_.length; i++) {
      contractName_ = contractNames_[i];
      if (contractName_.equals("proxy")) {
        // skip proxy address
        continue;
      } else {
        // set address from registry
        address_ = registryContract.getAddressForStringOrDie(contractName_);
      }

      // load selectors for given contract from file
      selectorJson_ = vm.readFile(string.concat("./.tmp/selectors/", contractName_, ".json"));

      // get function names with types
      functionsWithTypes_ = vm.parseJsonKeys(selectorJson_, "");

      // get functions names from constitution for contract
      functionNames_ = vm.parseJsonKeys(constitutionJson_, string.concat(".", contractName_));

      // loop over function names
      for (uint256 j = 0; j < functionNames_.length; j++) {
        functionName_ = functionNames_[j];
        if (functionName_.equals("default")) {
          // use empty selector as default
          selector_ = hex"00000000";
        } else {
          // retrieve selector from selector JSON
          selector_ = selectorJson_.getSelector(functionsWithTypes_, functionName_, vm);
        }

        // determine treshold from constitution
        threshold_ = constitutionJson_.readUint(
          string.concat(".", contractName_, ".", functionName_)
        );

        // push new test case
        constitutionCases.push(
          ConstitutionCase(contractName_, address_, functionName_, selector_, threshold_)
        );
      }
    }
  }

  function test_shouldHaveCorrectThreshold() public parametrized__constitutionCase {
    emit LogConstitutionCase(currentCase);
    assertEq(
      governance.getConstitution(currentCase.contractAddress, currentCase.selector),
      currentCase.threshold
    );
  }
}

contract E2E_Governance is Devchain {
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

    // transfer out ownership to governance
    vm.prank(ownerAddress);
    Ownable(address(registryContract)).transferOwnership(address(governance));

    // setup tester account
    vm.deal(tester, 10_000_001 ether + minDeposit);
    vm.startPrank(tester);
    accounts.createAccount();
    lockedCelo.lock{ value: 10_000_000 ether }();
    vm.stopPrank();

    // retrieve locked celo
    locked = lockedCelo.getAccountTotalLockedGold(tester);
  }

  function beforeTestSetup(
    bytes4 _testSelector
  ) public pure virtual returns (bytes[] memory beforeCalldata_) {
    // ensure tests inherit state
    if (_testSelector == this.test_shouldUpvoteProposal.selector) {
      beforeCalldata_ = new bytes[](1);
      beforeCalldata_[0] = abi.encodePacked(this.test_shouldIncrementProposalCount.selector);
    } else if (_testSelector == this.test_shouldApproveProposal.selector) {
      beforeCalldata_ = new bytes[](2);
      beforeCalldata_[0] = abi.encodePacked(this.test_shouldIncrementProposalCount.selector);
      beforeCalldata_[1] = abi.encodePacked(this.test_shouldUpvoteProposal.selector);
    } else if (_testSelector == this.test_shouldIncrementVoteTotals.selector) {
      beforeCalldata_ = new bytes[](3);
      beforeCalldata_[0] = abi.encodePacked(this.test_shouldIncrementProposalCount.selector);
      beforeCalldata_[1] = abi.encodePacked(this.test_shouldUpvoteProposal.selector);
      beforeCalldata_[2] = abi.encodePacked(this.test_shouldApproveProposal.selector);
    } else if (_testSelector == this.test_shouldExecuteProposal.selector) {
      beforeCalldata_ = new bytes[](4);
      beforeCalldata_[0] = abi.encodePacked(this.test_shouldIncrementProposalCount.selector);
      beforeCalldata_[1] = abi.encodePacked(this.test_shouldUpvoteProposal.selector);
      beforeCalldata_[2] = abi.encodePacked(this.test_shouldApproveProposal.selector);
      beforeCalldata_[3] = abi.encodePacked(this.test_shouldIncrementVoteTotals.selector);
    }
  }

  function test_shouldIncrementProposalCount() public virtual {
    // setup values
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

    // assert
    assertEq(governance.proposalCount(), proposalId);
  }

  function test_shouldUpvoteProposal() public {
    // upvote
    vm.prank(tester);
    governance.upvote(
      proposalId,
      0, // lesser
      0 // greater
    );

    // assert
    assertEq(governance.getUpvotes(proposalId), locked);
    assertGt(locked, 0);
  }

  function test_shouldApproveProposal() public {
    // increase time and mine 1 block
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

    // assert
    assertTrue(governance.isApproved(proposalId));
  }

  function test_shouldIncrementVoteTotals() public {
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

    // assert
    (uint256 yesVotes, , ) = governance.getVoteTotals(proposalId);
    assertEq(yesVotes, locked);
  }

  function test_shouldExecuteProposal() public virtual {
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
    vm.prank(ownerAddress);
    Ownable(address(governanceSlasher)).transferOwnership(address(governance));

    // setup slashed account
    vm.deal(slashed, penalty + 1 ether);
    vm.startPrank(slashed);
    accounts.createAccount();
    lockedCelo.lock{ value: penalty }();
    vm.stopPrank();
  }

  function beforeTestSetup(
    bytes4 _testSelector
  ) public pure virtual override returns (bytes[] memory beforeCalldata_) {
    if (
      _testSelector == this.test_shouldSetApprovedSlashingZero.selector ||
      _testSelector == this.test_shouldSlashAccount.selector
    ) {
      beforeCalldata_ = new bytes[](5);
      beforeCalldata_[0] = abi.encodePacked(this.test_shouldIncrementProposalCount.selector);
      beforeCalldata_[1] = abi.encodePacked(this.test_shouldUpvoteProposal.selector);
      beforeCalldata_[2] = abi.encodePacked(this.test_shouldApproveProposal.selector);
      beforeCalldata_[3] = abi.encodePacked(this.test_shouldIncrementVoteTotals.selector);
      beforeCalldata_[4] = abi.encodePacked(this.test_shouldExecuteProposal.selector);
    } else return super.beforeTestSetup(_testSelector);
  }

  function test_shouldIncrementProposalCount() public virtual override {
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

    // assert
    assertEq(governance.proposalCount(), proposalId);
  }

  function test_shouldExecuteProposal() public virtual override {
    // increase time and mine 1 block
    timeTravel(referendumDuration);
    blockTravel(1);

    // execute
    vm.prank(tester);
    governance.execute(proposalId, dequeueIndex);

    // assert
    assertEq(governanceSlasher.getApprovedSlashing(slashed), penalty);
  }

  function _slash() internal {
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
