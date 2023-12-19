pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import "../DoubleSigningSlasher.sol";
import "./MockUsingPrecompiles.sol";

contract DoubleSigningSlasherTest is DoubleSigningSlasher(true), MockUsingPrecompiles {
  struct SlashParams {
    address signer;
    uint256 index;
    bytes headerA;
    bytes headerB;
    uint256 groupMembershipHistoryIndex;
    address[] validatorElectionLessers;
    address[] validatorElectionGreaters;
    uint256[] validatorElectionIndices;
    address[] groupElectionLessers;
    address[] groupElectionGreaters;
    uint256[] groupElectionIndices;
  }

  function mockSlash(SlashParams calldata slashParams) external {
    slash(
      slashParams.signer,
      slashParams.index,
      slashParams.headerA,
      slashParams.headerB,
      slashParams.groupMembershipHistoryIndex,
      slashParams.validatorElectionLessers,
      slashParams.validatorElectionGreaters,
      slashParams.validatorElectionIndices,
      slashParams.groupElectionLessers,
      slashParams.groupElectionGreaters,
      slashParams.groupElectionIndices
    );
  }
}
