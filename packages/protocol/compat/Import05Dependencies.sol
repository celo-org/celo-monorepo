pragma solidity ^0.5.13;

// this file only exists so that foundry compiles this contracts
import { Proxy } from "@celo-contracts/common/Proxy.sol";
import { ProxyFactory } from "@celo-contracts/common/ProxyFactory.sol";
import { GoldToken } from "@celo-contracts/common/GoldToken.sol";
import { Accounts } from "@celo-contracts/common/Accounts.sol";
import { Election } from "@celo-contracts/governance/Election.sol";
import { Governance } from "@celo-contracts/governance/Governance.sol";
import { LockedGold } from "@celo-contracts/governance/LockedGold.sol";
import { GovernanceApproverMultiSig } from "@celo-contracts/governance/GovernanceApproverMultiSig.sol";
import { Escrow } from "@celo-contracts/identity/Escrow.sol";
import { FederatedAttestations } from "@celo-contracts/identity/FederatedAttestations.sol";
import { SortedOracles } from "@celo-contracts/stability/SortedOracles.sol";
import { ReserveSpenderMultiSig } from "@mento-core/contracts/ReserveSpenderMultiSig.sol";
import { Reserve } from "@mento-core/contracts/Reserve.sol";
import { StableToken } from "@mento-core/contracts/StableToken.sol";
import { StableTokenEUR } from "@mento-core/contracts/StableTokenEUR.sol";
import { StableTokenBRL } from "@mento-core/contracts/StableTokenBRL.sol";
import { Exchange } from "@mento-core/contracts/Exchange.sol";

import { IEpochManager } from "@celo-contracts/common/interfaces/IEpochManager.sol"; // TODO remove this?
import { IValidators } from "@celo-contracts/governance/interfaces/IValidators.sol";
import "@celo-contracts/common/interfaces/ICeloUnreleasedTreasury.sol";

contract Import05 {}
