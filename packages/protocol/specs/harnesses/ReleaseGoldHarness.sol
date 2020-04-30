pragma solidity ^0.5.8;

import "contracts/governance/ReleaseGold.sol";
import "specs/harnesses/ElectionHarness.sol";
import "specs/harnesses/LockedGoldHarness.sol";
import "contracts/common/Accounts.sol";

contract ReleaseGoldHarness is ReleaseGold {
  LockedGoldHarness lockedGold2;
  ElectionHarness election;
  Accounts accounts;
  uint256 public totalReward = 0;

  // for using invariant - must have this function that simulates the constructor
  function init_state() public {}

  /*** override the getters for the other contracts so we can link to the contract ****/
  function getLockedGold() internal view returns (ILockedGold) {
    return lockedGold2;
  }

  function getElection() internal view returns (IElection) {
    return election;
  }

  function getAccounts() internal view returns (IAccounts) {
    return accounts;
  }

  function getTotalWithdrawn() public view returns (uint256) {
    return totalWithdrawn;
  }

  function getTotalReward() public view returns (uint256) {
    return totalReward;
  }

  function ercBalance() public view returns (uint256) {
    return address(this).balance;
  }

  function ercBalancebeneficiary() public view returns (uint256) {
    return beneficiary.balance;
  }

  function getPendingWithdrawalsLength() external view returns (uint256) {
    return lockedGold2.getPendingWithdrawalsLength(address(this));
  }

  function getAuthorizedBy() external view returns (address) {
    return accounts.authorizedBy(address(this));
  }

  function revokePending(
    address group,
    uint256 value,
    address lesser,
    address greater,
    uint256 index
  ) external nonReentrant onlyWhenInProperState {
    if (election.getPendingVotesForGroupByAccount(group, address(this)) > 0) {
      address[] memory groupsVotedFor = election.getGroupsVotedForByAccount(address(this));
      require(groupsVotedFor.length > 0);
      require(groupsVotedFor[0] == group);
    }
    election.revokePending(group, value, lesser, greater, index);
  }

  function revokeActive(
    address group,
    uint256 value,
    address lesser,
    address greater,
    uint256 index
  ) external nonReentrant onlyWhenInProperState {
    require(
      election.getActiveVoteUnitsForGroupByAccount(group, address(this)) <=
        election.getActiveVoteUnitsForGroup(group)
    );
    election.revokeActive(group, value, lesser, greater, index);
    totalReward = totalReward.add(value);
  }

  function MAX_WITHDRAWL() public view returns (uint256) {
    return releaseSchedule.numReleasePeriods.mul(releaseSchedule.amountReleasedPerPeriod);
  }

  function releaseTime() public view returns (uint256) {
    return
      releaseSchedule.releaseStartTime.add(
        releaseSchedule.numReleasePeriods.mul(releaseSchedule.releasePeriod)
      );
  }

  function isAccount(address a) public view returns (bool) {
    return accounts.isAccount(a);
  }

  function getTotalPendingWithdrawals(address a) public view returns (uint256) {
    return lockedGold2.getTotalPendingWithdrawals(a);
  }

  function getRemainingLockedBalance() public view returns (uint256) {
    uint256 pendingWithdrawalSum = 0;
    if (accounts.isAccount(address(this))) {
      pendingWithdrawalSum = getLockedGold().getTotalPendingWithdrawals(address(this));
    }
    //return getLockedGold().getAccountTotalLockedGold(address(this)).add(pendingWithdrawalSum);
    //inlin getAccountTotalLockedGold
    uint256 total = lockedGold2.getAccountNonvotingLockedGold(address(this));
    total = total.add(election.getTotalVotesByAccount(address(this)));
    return total.add(pendingWithdrawalSum);
  }

  function withdrawalPossible(uint256 amount) external nonReentrant onlyBeneficiary {
    require(amount > 0, "Requested withdrawal amount must be greater than zero");
    require(liquidityProvisionMet, "Requested withdrawal before liquidity provision is met");

    uint256 releasedAmount;
    if (isRevoked()) {
      releasedAmount = revocationInfo.releasedBalanceAtRevoke;
    } else {
      releasedAmount = getCurrentReleasedTotalAmount();
    }

    require(
      releasedAmount.sub(totalWithdrawn) >= amount,
      "Requested amount is greater than available released funds"
    );
    require(
      maxDistribution >= totalWithdrawn.add(amount),
      "Requested amount exceeds current alloted maximum distribution"
    );
    require(
      getRemainingUnlockedBalance() >= amount,
      "Insufficient unlocked balance to withdraw amount"
    );
    totalWithdrawn = totalWithdrawn.add(amount);
    beneficiary /* @certora Beneficiary.nothing() */
      .transfer(amount);
    if (getRemainingTotalBalance() == 0) {
      emit ReleaseGoldInstanceDestroyed(beneficiary, address(this));
      selfdestruct(refundAddress);
    }
  }

}
