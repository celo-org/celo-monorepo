pragma solidity ^0.5.13;

import "../DowntimeSlasher.sol";
import "./MockUsingPrecompiles.sol";

contract DowntimeSlasherTest is DowntimeSlasher(true), MockUsingPrecompiles {}
