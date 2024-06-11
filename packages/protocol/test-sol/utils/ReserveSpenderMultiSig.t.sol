pragma solidity ^0.5.13;

import "@mento-core/contracts/ReserveSpenderMultiSig.sol";

/**
  The purpose of this file is not to provide test coverage for `ReserveSpenderMultiSig.sol`.
  This is an empty test to force foundry to compile `ReserveSpenderMultiSig.sol`, and include its
  artifacts in the `/out` directory. `ReserveSpenderMultiSig.sol` is needed in the migrations
  script, but because it's on Solidity 0.5 it can't be imported there directly.
  If there is a better way to force foundry to compile `ReserveSpenderMultiSig.sol` without
  this file, this file can confidently be deleted.
 */
contract ReserveSpenderMultiSigTest {}
