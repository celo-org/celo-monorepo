pragma solidity ^0.5.8;


interface IElection {
  function isVoting(address) external view returns(bool);
}
