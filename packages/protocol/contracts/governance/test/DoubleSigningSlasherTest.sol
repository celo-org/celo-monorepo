pragma solidity ^0.5.13;

import "../DoubleSigningSlasher.sol";
import "./MockUsingPrecompiles.sol";

contract DoubleSigningSlasherTest is DoubleSigningSlasher(true), MockUsingPrecompiles {}
