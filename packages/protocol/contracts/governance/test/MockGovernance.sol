pragma solidity ^0.5.13;

import "../interfaces/IGovernance.sol";

/**
 * @title A mock Governance for testing.
 */
contract MockGovernance is IGovernance {
  mapping(address => bool) public isVoting;
  mapping(address => uint256) public totalVotes;
  mapping(address => uint256) public removeVotesCalledFor;

  function() external payable {} // solhint-disable no-empty-blocks

  function setVoting(address voter) external {
    isVoting[voter] = true;
  }

  function setTotalVotes(address voter, uint256 votes) external {
    totalVotes[voter] = votes;
  }

  function getAmountOfGoldUsedForVoting(address account) external view returns (uint256) {
    return totalVotes[account];
  }

  function removeVotesWhenRevokingDelegatedVotes(address account, uint256 maxAmountAllowed)
    external
  {
    removeVotesCalledFor[account] = maxAmountAllowed;
    // require(maxAmountAllowed == 666, string(abi.encodePacked(account, " ", uintToStr(maxAmountAllowed))));
    // require(maxAmountAllowed == 666, "ONNNNNM");
  }

  function uintToStr(uint256 _i) internal pure returns (string memory _uintAsString) {
    uint256 number = _i;
    if (number == 0) {
      return "0";
    }
    uint256 j = number;
    uint256 len;
    while (j != 0) {
      len++;
      j /= 10;
    }
    bytes memory bstr = new bytes(len);
    uint256 k = len - 1;
    while (number != 0) {
      bstr[k--] = bytes1(uint8(48 + (number % 10)));
      number /= 10;
    }
    return string(bstr);
  }

}
