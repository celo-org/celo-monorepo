// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

// Test imports
import { Devchain } from "@test-sol/devchain/e2e/utils.sol";

import { console } from "forge-std-8/console.sol";

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
  // test cases
  struct SelectorThresholdPair {
    bytes4 selector;
    uint256 threshold;
  }
  struct ConstitutionCase {
    string contractName;
    address contractAddress;
    // SelectorThresholdPair[] selectorsWithThresholds;
  }
  ConstitutionCase[] internal constitutionCases;
  ConstitutionCase internal currentCase;

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
    string memory name_;
    address address_;
    // SelectorThresholdPair[] memory stPairs;

    // loop over contracts
    for (uint256 i = 0; i < contractNames_.length; i++) {
      name_ = contractNames_[i];
      if (compareStrings(name_, "proxy")) {
        // skip proxy address
        continue;
      } else {
        // set other addresses from registry
        address_ = registryContract.getAddressForStringOrDie(name_);
      }
      // stPairs = new SelectorThresholdPair[](0);
      constitutionCases.push(
        ConstitutionCase(
          name_,
          address_
          // stPairs
        )
      );
    }
  }

  function test_shouldHaveCorrectThreshold() public parametrized__constitutionCase {
    assertEq(governance.getConstitution(currentCase.contractAddress, 0x00000000), 2);
  }
}
