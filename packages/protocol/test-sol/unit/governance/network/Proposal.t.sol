// SPDX-License-Identifier: UNLICENSED
pragma solidity >=0.8.7 <0.8.20;

import { TestWithUtils08 } from "@test-sol/TestWithUtils08.sol";

import "@celo-contracts-8/governance/Proposals.sol";
import "@celo-contracts/common/FixidityLib.sol";

contract ProposalTest is TestWithUtils08 {
  using FixidityLib for FixidityLib.Fraction;

  Proposals.Proposal internal proposal;

  function setUp() public override {
    super.setUp();
    proposal.networkWeight = 100;
    whenL2WithEpochManagerInitialization();
  }
}

contract ProposalTest_getSupportWithQuorumPadding is ProposalTest {
  function test_ShouldReturnSupportRatioWhenParticipationAboveCriticalBaseline() public {
    proposal.votes.yes = 15;
    proposal.votes.no = 10;
    proposal.votes.abstain = 30;

    uint256 expected = FixidityLib.newFixedFraction(15, 25).value; // yes / (yes+no)
    FixidityLib.Fraction memory quorum = FixidityLib.newFixedFraction(5, 10);
    assertEq(Proposals.getSupportWithQuorumPadding(proposal, quorum).value, expected);
  }

  function test_shouldReturnLoweredSupportRatioWhenParticipationBelowCriticalBaseline() public {
    proposal.votes.yes = 15;
    proposal.votes.no = 10;
    proposal.votes.abstain = 10;
    // 15 "no" votes added to reach quorum of 50 votes (50% baseline * 100 network weight)
    uint256 addedNo = 50 - 15 - 10 - 10;
    uint256 expected = FixidityLib.newFixedFraction(15, 25 + addedNo).value; // yes / (yes+no+addedNo)

    FixidityLib.Fraction memory quorum = FixidityLib.newFixedFraction(5, 10);
    assertEq(Proposals.getSupportWithQuorumPadding(proposal, quorum).value, expected);
  }

  function test_shouldReturn0SupportRatioWhen0YesVotesAnd0NoVotesAreCast() public {
    proposal.votes.yes = 0;
    proposal.votes.no = 0;
    proposal.votes.abstain = 30;
    FixidityLib.Fraction memory quorum = FixidityLib.newFixedFraction(5, 10);

    assertEq(Proposals.getSupportWithQuorumPadding(proposal, quorum).value, 0);
  }
}
