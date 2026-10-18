pragma solidity ^0.5.13;

// This file only exists so that foundry compiles the vendored Mento contracts the devchain
// migration deploys; it is copied into contracts-0.5 for the solc-0.5 build.
import { ReserveSpenderMultiSig } from "@mento-core/contracts/ReserveSpenderMultiSig.sol";
import { Reserve } from "@mento-core/contracts/Reserve.sol";
import { StableToken } from "@mento-core/contracts/StableToken.sol";
import { StableTokenEUR } from "@mento-core/contracts/StableTokenEUR.sol";
import { StableTokenBRL } from "@mento-core/contracts/StableTokenBRL.sol";
import { Exchange } from "@mento-core/contracts/Exchange.sol";

contract Import05 {}
