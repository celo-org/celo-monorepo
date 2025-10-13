pragma solidity ^0.5.13;

// this file only exists so that foundry compiles this contracts
import { Proxy } from "./common/Proxy.sol";
import { ProxyFactory } from ".//common/ProxyFactory.sol";
import { GoldToken } from ".//common/GoldToken.sol";
import { Accounts } from ".//common/Accounts.sol";
import { Election } from ".//governance/Election.sol";
import { Governance } from ".//governance/Governance.sol";
import { LockedGold } from ".//governance/LockedGold.sol";
import { GovernanceApproverMultiSig } from ".//governance/GovernanceApproverMultiSig.sol";
import { Escrow } from ".//identity/Escrow.sol";
import { FederatedAttestations } from ".//identity/FederatedAttestations.sol";
import { SortedOracles } from ".//stability/SortedOracles.sol";

// import { IEpochManager } from ".//common/interfaces/IEpochManager.sol";
// import { IValidators } from ".//governance/interfaces/IValidators.sol";
// import ".//common/interfaces/ICeloUnreleasedTreasury.sol";

contract Import05 {}
