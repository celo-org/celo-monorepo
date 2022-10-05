pragma solidity ^0.5.13;

import "../BlockchainParameters.sol";
import "./MockUsingPrecompiles.sol";

contract BlockchainParametersTest is BlockchainParameters(true), MockUsingPrecompiles {}
