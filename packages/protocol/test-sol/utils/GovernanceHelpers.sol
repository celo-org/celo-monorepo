// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.5.13;
pragma experimental ABIEncoderV2;

import { Test, console2 as console } from "celo-foundry/Test.sol";

import "contracts/governance/Governance.sol";
import "./WithRegistry.sol";
import "./WithForks.sol";

contract GovernanceHelpers is Test, WithRegistry, WithForks {
  Governance governance;
  mapping(uint256 => address[]) whalesForEnv;

  constructor() public WithRegistry(true) WithForks() {
    whalesForEnv[mainnetForkId] = [
      0x7Ae2f01aB6B6681148b50248D0b99a6aBC5a09d5,
      0xbdAccF951C8A219fC69Ce8F171a61a3DDAeFEB39,
      0x489dCa840aA686Cf055C342C165E9358889840DE,
      0x1dEc9eaE55fe9348bc195A57df03F1cD51Fe13D1,
      0x244d46d45050e451D0E759B1CFd0b2c08818cA38
    ];
  }

  function executeProposal(Proposals.Transaction[] memory transactions, string memory id)
    internal
    returns (uint256 proposalId)
  {
    governance = Governance(address(uint160(registry.getAddressForString("Governance"))));
    proposalId = createProposal(transactions, id);
    // uint256 proposalIndex = passProposal(proposalId);
    // governance.execute(proposalId, proposalIndex);
    // changePrank(address(this));
  }

  function createProposal(Proposals.Transaction[] memory transactions, string memory id)
    internal
    returns (uint256)
  {
    (uint256[] memory values, address[] memory destinations, bytes memory data, uint256[] memory dataLengths) = serializeTransactions(
      transactions
    );

    deal(address(this), governance.minDeposit());
    (bool success, bytes memory returnData) = address(governance).call.value(
      governance.minDeposit()
    )(
      abi.encodeWithSignature(
        "propose(uint256[],address[],bytes,uint256[],string)",
        values,
        destinations,
        data,
        dataLengths,
        id
      )
    );

    if (success == false) {
      console.logBytes(returnData);
    }
    require(success);
    return abi.decode(returnData, (uint256));
  }

  function passProposal(uint256 proposalId) internal returns (uint256 proposalIndex) {
    address[] memory whales = whalesForEnv[vm.activeFork()];
    console.log(vm.activeFork());
    console.log(whales.length);

    uint256 lesser = 0;
    uint256 greater = 0;
    bool found = false;
    uint256 i = 0;

    (uint256[] memory queue, ) = governance.getQueue();
    for (i = 0; i < queue.length; i++) {
      if (queue[i] == proposalId) {
        found = true;
      } else if (found == false) {
        lesser = queue[i];
      } else if (found == true) {
        greater = queue[i];
        break;
      }
    }

    for (i = 0; i < whales.length; i++) {
      changePrank(whales[i]);
      governance.upvote(proposalId, lesser, greater);
    }

    vm.warp(now + governance.dequeueFrequency() + 10);
    governance.dequeueProposalsIfReady();

    proposalIndex = getProposalDequeueIndex(proposalId);

    changePrank(governance.approver());
    governance.approve(proposalId, proposalIndex);

    vm.warp(now + governance.getApprovalStageDuration());
    for (i = 0; i < whales.length; i++) {
      changePrank(whales[i]);
      governance.vote(proposalId, proposalIndex, Proposals.VoteValue.Yes);
    }

    vm.warp(now + governance.getReferendumStageDuration());
    console.log(uint256(governance.getProposalStage(proposalId)));
  }

  function getProposalDequeueIndex(uint256 proposalId)
    internal
    view
    returns (uint256 proposalIndex)
  {
    uint256[] memory dequeue = governance.getDequeue();

    for (uint256 i = 0; i < dequeue.length; i++) {
      if (dequeue[i] == proposalId) {
        proposalIndex = i;
        break;
      }
    }
  }

  function serializeTransactions(Proposals.Transaction[] memory transactions)
    internal
    pure
    returns (
      uint256[] memory values,
      address[] memory destinations,
      bytes memory data,
      uint256[] memory dataLengths
    )
  {
    values = new uint256[](transactions.length);
    destinations = new address[](transactions.length);
    dataLengths = new uint256[](transactions.length);

    for (uint256 i = 0; i < transactions.length; i++) {
      values[i] = transactions[i].value;
      destinations[i] = transactions[i].destination;
      data = abi.encodePacked(data, transactions[i].data);
      dataLengths[i] = transactions[i].data.length;
    }
  }
}
