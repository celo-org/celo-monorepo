pragma solidity ^0.5.13;

// this file only exists so that foundry compiles this contracts
import { Proxy } from "@celo-contracts/common/Proxy.sol";
import { ProxyFactory } from "@celo-contracts/common/ProxyFactory.sol";
import { ReserveSpenderMultiSig } from "@mento-core/contracts/ReserveSpenderMultiSig.sol";
import { Reserve } from "@mento-core/contracts/Reserve.sol";
import { StableToken } from "@mento-core/contracts/StableToken.sol";
import { StableTokenEUR } from "@mento-core/contracts/StableTokenEUR.sol";
import { StableTokenBRL } from "@mento-core/contracts/StableTokenBRL.sol";
import { Exchange } from "@mento-core/contracts/Exchange.sol";

contract Import05 {}
