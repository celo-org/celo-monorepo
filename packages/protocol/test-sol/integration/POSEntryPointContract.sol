// THIS TEST IS RUN IN A FORKED ENVIRONMENT FROM DEVCHAIN

// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;
import "@celo-contracts/common/UsingRegistry.sol";
import "@celo-contracts/common/interfaces/IRegistry.sol";
import "@celo-contracts/common/FixidityLib.sol";

import "@celo-contracts/governance/interfaces/IValidators.sol";
import "forge-std/console.sol";


// This is in a separate contract because if it's in the same contracts as the test
// gas profiling doesn't work

contract POSEntryPointContract is UsingRegistry {
  using FixidityLib for FixidityLib.Fraction;
  IValidators validators;

  constructor(address _registryAddress) public {
    registry = IRegistry(_registryAddress);
    validators = getValidators();
  }

  function _expensiveCall() public {
    // TODO remove registry calls to more accuretly profile gas

    address[] memory signers = getElection().electValidatorSigners(); // 4297212 gas

    // These are the validators in the past epoch
    // in order, I think
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
      // Validator reward
      validators.distributeEpochPaymentsFromSigner(signers[i], maxRewardsValidator);

      // voters
      address group = validators.getMembershipInLastEpoch(signers[i]); // TODO will break with a precompile
      // hardcode uptime to 1
      uint256[] memory uptimes = new uint256[](1);
      uptimes[0] = FixidityLib.unwrap(FixidityLib.fixed1());
      uint256 epochRewards = getElection().getGroupEpochRewards(group, rewardsVoter, uptimes);

      // I think they should be zero
      activate votes, otherwise they will be zero
      need to be able to fake the epoch
      console.log("Rewrd for group is", epochRewards);


      // blockchain does a getTotalVotesForEligibleValidatorGroupsMethod
      // which returns a whole list, I don't think we need to do that here
      // getElection().getTotalVotesForGroup(group); // I think we may not even need this?

      // getElection().distributeEpochRewards(group, epochRewards, lesser , greather);

      // here the sorting magic needs to happen

    }

    // distributeEpochRewards
    // GoldToken.sol:mint(reserve) -> (for validator rewards)
    // GoldToken.sol:mint(community fund/feehandler) ->
    // GoldToken.sol:mint(carbon offsetting partner) ->

    // getValidators().entryPointElectAndDistribute();
  }
}
