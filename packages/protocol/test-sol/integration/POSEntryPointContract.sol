// THIS TEST IS RUN IN A FORKED ENVIRONMENT FROM DEVCHAIN

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;
import "@celo-contracts/common/UsingRegistry.sol";
import "@celo-contracts/common/interfaces/IRegistry.sol";

import "@celo-contracts/governance/interfaces/IValidators.sol";

// This is in a separate contract because if it's in the same contracts as the test
// gas profiling doesn't work

contract POSEntryPointContract is UsingRegistry {
  IValidators validators;

  constructor(address _registryAddress) public {
    registry = IRegistry(_registryAddress);
    validators = getValidators();
  }

  function _expensiveCall() public {
    // TODO remove registry calls to more accuretly profile gas

    address[] memory signers = getElection().electValidatorSigners(); // 4297212 gas

    getEpochRewards().updateTargetVotingYieldCel2(); // 90000 gas

    uint256 maxRewardsValidator;
    uint256 rewardsVoter;
    uint256 rewardsCommunity;
    uint256 rewardsCarbonFund;

    (maxRewardsValidator, rewardsVoter, rewardsCommunity, rewardsCarbonFund) = getEpochRewards()
      .calculateTargetEpochRewards(); // 4468692-(90000+4297212)=81000 + couple of storage reads
    // UpdateValidatorScore, ignored, there's nothing to do

    // thise whole loop 14643842-(90000+4297212+81000)=10200000
    for (uint i = 0; i < signers.length; i++) {
      validators.distributeEpochPaymentsFromSigner(signers[i], maxRewardsValidator);
      address group = validators.getMembershipInLastEpoch(signers[i]); // TODO will break with a precompile
      uint256 epochRewards = getElection().getGroupEpochRewards(group, totalEpochRewards, uptimes);
    }

    // distributeEpochRewards
    // GoldToken.sol:mint(reserve) -> (for validator rewards)
    // GoldToken.sol:mint(community fund/feehandler) ->
    // GoldToken.sol:mint(carbon offsetting partner) ->

    // getValidators().entryPointElectAndDistribute();
  }
}
