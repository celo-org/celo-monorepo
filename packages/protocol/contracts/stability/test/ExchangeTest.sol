pragma solidity ^0.5.13;

import "../Exchange.sol";

contract ExchangeTest is Exchange {
  function updateBuckets() public updateBucketsIfNecessary {}
}
