pragma solidity ^0.5.3;


interface IElection {
  function isVoting(address) external view returns(bool);
}
