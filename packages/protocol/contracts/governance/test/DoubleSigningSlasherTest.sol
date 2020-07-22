pragma solidity ^0.5.3;

import "../DoubleSigningSlasher.sol";
import "./MockUsingPrecompiles.sol";

contract DoubleSigningSlasherTest is DoubleSigningSlasher, MockUsingPrecompiles {}
