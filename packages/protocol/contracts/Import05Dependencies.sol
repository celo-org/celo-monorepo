pragma solidity ^0.5.13;

// / this file only exists so that foundry compiles this contracts
import { Proxy } from "./common/Proxy.sol";
import { ProxyFactory } from "./common/ProxyFactory.sol";
import { GoldToken } from "./common/GoldToken.sol";
import { Accounts } from "./common/Accounts.sol";
import { Election } from "./governance/Election.sol";
import { Governance } from "./governance/Governance.sol";
import { LockedGold } from "./governance/LockedGold.sol";
import { GovernanceApproverMultiSig } from "./governance/GovernanceApproverMultiSig.sol";
import { Escrow } from "./identity/Escrow.sol";
import { FederatedAttestations } from "./identity/FederatedAttestations.sol";
import { SortedOracles } from "./stability/SortedOracles.sol";

import { ReserveSpenderMultiSig } from "../lib/mento-core/contracts/ReserveSpenderMultiSig.sol";
import { Reserve } from "../lib/mento-core/contracts/Reserve.sol";
import { StableToken } from "../lib/mento-core/contracts/StableToken.sol";
import { StableTokenEUR } from "../lib/mento-core/contracts/StableTokenEUR.sol";
import { StableTokenBRL } from "../lib/mento-core/contracts/StableTokenBRL.sol";
import { Exchange } from "../lib/mento-core/contracts/Exchange.sol";

contract Import05 {}
