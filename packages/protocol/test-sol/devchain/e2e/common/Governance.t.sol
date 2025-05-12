// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

// Foundry imports
import { console } from "forge-std-8/console.sol";
import { stdJson } from "forge-std-8/StdJson.sol";

// Local imports
import { StringUtils } from "@celo-contracts/common/libraries/StringUtils.sol";
import { SelectorParser } from "@celo-contracts/common/test/SelectorParser.sol";

// Test imports
import { Devchain, IGovernance } from "@test-sol/devchain/e2e/utils.sol";

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

contract E2E_Governance is Devchain {
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
