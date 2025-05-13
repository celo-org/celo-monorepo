/**
 * Be careful when adding to this file or relying on this file.
 * The verification tooling uses the CeloContractName enum as a
 * source of truth for what contracts are considered "core" and
 * need to be checked for backwards compatability and bytecode on
 * an environment.
 */

import { ContractPackage, MENTO_PACKAGE, SOLIDITY_08_PACKAGE } from "../contractPackages";

export const celoRegistryAddress = '0x000000000000000000000000000000000000ce10'

export enum CeloContractName {
  Accounts = 'Accounts',
  Attestations = 'Attestations',
  BlockchainParameters = 'BlockchainParameters',
  DoubleSigningSlasher = 'DoubleSigningSlasher',
  DowntimeSlasher = 'DowntimeSlasher',
  Election = 'Election',
  EpochRewards = 'EpochRewards',
  Escrow = 'Escrow',
  Exchange = 'Exchange',
  ExchangeEUR = 'ExchangeEUR',
  ExchangeBRL = 'ExchangeBRL',
  FederatedAttestations = 'FederatedAttestations',
  FeeHandler = 'FeeHandler',
  MentoFeeHandlerSeller = 'MentoFeeHandlerSeller',
  FeeCurrencyWhitelist = 'FeeCurrencyWhitelist',
  Freezer = 'Freezer',
  GasPriceMinimum = 'GasPriceMinimum',
  FeeCurrencyDirectory = 'FeeCurrencyDirectory',
  GoldToken = 'GoldToken',
  Governance = 'Governance',
  GovernanceSlasher = 'GovernanceSlasher',
  GovernanceApproverMultiSig = 'GovernanceApproverMultiSig',
  GrandaMento = 'GrandaMento',
  LockedGold = 'LockedGold',
  MintGoldSchedule = 'MintGoldSchedule',
  OdisPayments = 'OdisPayments',
  Random = 'Random',
  Reserve = 'Reserve',
  ReserveSpenderMultiSig = 'ReserveSpenderMultiSig',
  SortedOracles = 'SortedOracles',
  StableToken = 'StableToken',
  StableTokenEUR = 'StableTokenEUR',
  StableTokenBRL = 'StableTokenBRL',
  TransferWhitelist = 'TransferWhitelist',
  UniswapFeeHandlerSeller = 'UniswapFeeHandlerSeller',
  Validators = 'Validators',
}

export const usesRegistry = [
  CeloContractName.Reserve,
  CeloContractName.StableToken,
]

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
      CeloContractName.GoldToken,
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
