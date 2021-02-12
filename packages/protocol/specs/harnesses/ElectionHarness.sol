pragma solidity ^0.5.8;
import "contracts/governance/Election.sol";
import "contracts/common/Accounts.sol";
import "specs/harnesses/LockedGoldHarness.sol";

contract ElectionHarness is Election {
  LockedGoldHarness lockedGold;
  Accounts accounts;


  /*** override the getters for the other contracts so we can link to the contract ****/
  function getLockedGold() internal view returns (ILockedGold) {
    return lockedGold;
  }
  
  /*** override the getters for the other contracts so we can link to the contract ****/
  function getLockedGoldFromSepc() public view returns (ILockedGold) {
    return lockedGold;
  }

  function getAccounts() internal view returns (IAccounts) {
	return accounts;
  }
  
  
    //Account wrappers
  function getVoteSignerToAccount() public view returns (address) { 
    return accounts.voteSignerToAccount(msg.sender);
  }
  
    //lockedGold wrappers
  function getTotalLockedGold(address account) public view returns (uint256) {
    return lockedGold.getAccountNonvotingLockedGold(account).add(lockedGold.getTotalPendingWithdrawals(account));
  }

  function getPendingWithdrawalsLength(address account) external view returns (uint256) {
    return lockedGold.getPendingWithdrawalsLength(account);
  }
  
  function getTotalPendingWithdrawals(address account) public view returns (uint256) {
    return lockedGold.getTotalPendingWithdrawals(account);
  }
  
  function getAccountNonvotingLockedGold(address account) public view returns (uint256) {
    return lockedGold.getAccountNonvotingLockedGold(account);
  }
  
 
  function ercBalance(address a) public view returns (uint256) {
    return a.balance;
  }


function getActiveVoteUnitsForGroupByAccount(address group, address account)
    public
    view
    returns (uint256)
  {
    return votes.active.forGroup[group].unitsByAccount[account];
  }



/*** override functions with non linear operations */
/*
toVotes(uint units, uint totalVotes,uint totalUnits) → uint
*/
mapping(uint256 => mapping( uint256 => mapping (uint256 => uint256))) toVotesGhost;

  function votesToUnits(address group, uint256 value) internal view returns (uint256) {
    //return toVotes(value,votes.active.forGroup[group].total,);
    if (value==votes.active.forGroup[group].total)
      return votes.active.forGroup[group].totalUnits;
    else {
      require(value < votes.active.forGroup[group].totalUnits );
      return value;
    }
    /*FixidityLib.Fraction memory fixedValue = FixidityLib.newFixed(value);
    if (votes.active.forGroup[group].total == 0) {
      return fixedValue.unwrap();
    } else {
      return
        fixedValue.multiply(FixidityLib.wrap(votes.active.forGroup[group].totalUnits)).unwrap().div(
          votes.active.forGroup[group].total
        );
    }*/
  }

  function toVotes(uint256 value, uint256 totalVotes, uint256 totalunits) public view returns (uint256) {
    return toVotesGhost[value][totalVotes][totalunits];
  }

  /**
   * @notice Returns the number of active votes corresponding to `value` units.
   * @param group The address of the validator group.
   * @param value The number of units.
   * @return The corresponding number of active votes.
   */
  function unitsToVotes(address group, uint256 value) internal view returns (uint256) {
    //FixidityLib.Fraction memory fixedValue = FixidityLib.wrap(value);
    if (votes.active.forGroup[group].totalUnits == 0) {
      return 0;
    } 
    else {
      if (votes.active.forGroup[group].totalUnits==value) {
        return votes.active.forGroup[group].total;
      }
      else {
        return value;
      /*  return
          fixedValue.multiply(FixidityLib.newFixed(votes.active.forGroup[group].total)).unwrap().div(
            votes.active.forGroup[group].totalUnits
          );
          */
      }
    }
  }

  // overriding to havoc more
  mapping (uint256 => mapping (uint256 => bytes32)) input_validatorSignerAddressFromCurrentSet;
  mapping (uint256 => mapping (uint256 => bytes32)) input_validatorSignerAddressFromSet;
   function validatorSignerAddressFromCurrentSet(uint256 index) public view returns (address) {
    bytes memory out;
    bool success;
    // let's not pack stuff and this will be easier on the solver
    bytes32 _input = input_validatorSignerAddressFromCurrentSet[index][block.number];
    bytes memory input = new bytes(32);
    assembly {
      mstore(add(input,32),_input)
    }
    (success, out) = GET_VALIDATOR.staticcall(input);
    require(success);
    return address(getUint256FromBytes(out, 0));
  }
  // TODO: Suggested Lucas to merge the two
    function validatorSignerAddressFromSet(uint256 index, uint256 blockNumber)
    public
    view
    returns (address)
  {
    bytes memory out;
    bool success;
     // let's not pack stuff and this will be easier on the solver
    bytes32 _input = input_validatorSignerAddressFromSet[index][blockNumber];
    bytes memory input = new bytes(32);
    assembly {
      mstore(add(input,32),_input)
    }
    (success, out) = GET_VALIDATOR.staticcall(input);
    require(success);
    return address(getUint256FromBytes(out, 0));
  }
 mapping (uint256 => mapping (uint256 => mapping (uint256 => mapping (uint256 => mapping (uint256 => mapping (uint256 => bytes32)))))) input_fractionMulExp;
 function fractionMulExp(
    uint256 aNumerator,
    uint256 aDenominator,
    uint256 bNumerator,
    uint256 bDenominator,
    uint256 exponent,
    uint256 _decimals
  ) public view returns (uint256, uint256) {
    require(aDenominator != 0 && bDenominator != 0);
    uint256 returnNumerator;
    uint256 returnDenominator;
    bool success;
    bytes memory out;
    bytes32 _input = input_fractionMulExp[aNumerator][aDenominator][bNumerator][bDenominator][exponent][_decimals];
    bytes memory input = new bytes(32);
    assembly {
      mstore(add(input,32),_input)
    }
    (success, out) = FRACTION_MUL.staticcall(
      input
    );
    require(
      success,
      "UsingPrecompiles :: fractionMulExp Unsuccessful invocation of fraction exponent"
    );
    returnNumerator = getUint256FromBytes(out, 0);
    returnDenominator = getUint256FromBytes(out, 32);
    return (returnNumerator, returnDenominator);
  }
  
  // havoc getEpochSize
  uint256 epochSize;
  function getEpochSize() public view returns (uint256) {
    return epochSize;
  }

  function init_state() public {}

  function getTotalVotesByAccount(address account) external view returns (uint256) {
    uint256 total = 0;
    uint256 len = votes.groupsVotedFor[account].length;
    //address[] memory groups = votes.groupsVotedFor[account];
    for (uint256 i = 0; i < len; i = i.add(1)) {
      total = total.add(getTotalVotesForGroupByAccount(votes.groupsVotedFor[account][i], account));
    }
    return total;
  }
  
}
