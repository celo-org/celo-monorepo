/**
 * Be careful when adding to this file or relying on this file.
 * The verification tooling uses the CeloContractName enum as a
 * source of truth for what contracts are considered "core" and
 * need to be checked for backwards compatability and bytecode on
 * an environment.
 */

import { CeloContractName, celoRegistryAddress } from "@celo/protocol/lib/contracts-list";
import { ContractPackage, MENTO_PACKAGE, SOLIDITY_08_PACKAGE } from "../contractPackages";

export const usesRegistry = [
  CeloContractName.Reserve,
  CeloContractName.StableToken,
]

export { CeloContractName, celoRegistryAddress };

export const hasEntryInRegistry: ContractPackage[] = [
  {
    name: "default",
    contracts: [
      CeloContractName.Accounts,
      CeloContractName.Attestations,
      CeloContractName.BlockchainParameters,
      CeloContractName.DoubleSigningSlasher,
      CeloContractName.DowntimeSlasher,
      CeloContractName.Election,
      CeloContractName.Escrow,
      CeloContractName.FederatedAttestations,
      CeloContractName.FeeCurrencyWhitelist,
      CeloContractName.Freezer,
      CeloContractName.GoldToken, //TODO: Update when contract name is changed.
      CeloContractName.GovernanceSlasher,
      CeloContractName.OdisPayments,
      CeloContractName.Random,
      CeloContractName.SortedOracles,
    ]
  },
  SOLIDITY_08_PACKAGE
  ,
  {
    ...MENTO_PACKAGE,
    // not all Mentro contracts are supposed to be in the Registry
    contracts: [
      CeloContractName.Exchange,
      CeloContractName.GrandaMento,
      CeloContractName.Reserve,
      CeloContractName.StableToken,
    ],
  }
]
