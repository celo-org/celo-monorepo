// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

// Foundry imports
import { console } from "forge-std-8/console.sol";
import { stdJson } from "forge-std-8/StdJson.sol";

// Local imports
import { StringUtils } from "@celo-contracts/common/libraries/StringUtils.sol";

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
    string memory json_ = vm.readFile("./governanceConstitution.json");
    string[] memory contractNames_ = vm.parseJsonKeys(json_, "");

    // vars for looping
    string memory contract_;
    address address_;
    string memory function_;
    bytes4 selector_;
    uint256 threshold_;

    // loop over contract names
    for (uint256 i = 0; i < contractNames_.length; i++) {
      contract_ = contractNames_[i];
      if (contract_.compareStrings("proxy")) {
        // skip proxy address
        continue;
      } else {
        // set address from registry
        address_ = registryContract.getAddressForStringOrDie(contract_);
      }

      // get all functions for contract
      string[] memory functionNames_ = vm.parseJsonKeys(json_, string.concat(".", contract_));

      // loop over function names
      for (uint256 j = 0; j < functionNames_.length; j++) {
        function_ = functionNames_[j];
        if (function_.compareStrings("default")) {
          // use empty selector as default
          selector_ = hex"00000000";
        } else {
          // use forge inspect through ffi to determine selector for function name
          string[] memory functionToSelector_ = new string[](4);
          functionToSelector_[0] = "bash";
          functionToSelector_[1] = "-c";
          functionToSelector_[2] = string.concat(
            "forge inspect ",
            contract_,
            " methods | grep ",
            function_,
            " | awk -F'|' '{print $3}' | awk '{$1=$1;print}'"
          );
          selector_ = bytes4(vm.ffi(functionToSelector_));
        }

        // determine treshold from constitution
        threshold_ = json_.readUint(string.concat(".", contract_, ".", function_));

        // push new test case
        constitutionCases.push(
          ConstitutionCase(contract_, address_, function_, selector_, threshold_)
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
