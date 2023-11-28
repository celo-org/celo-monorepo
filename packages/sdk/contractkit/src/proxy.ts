// tslint:disable: ordered-imports
import { ABIDefinition, AbiItem } from '@celo/connect'
import Web3 from 'web3'
import { ABI as GasPriceMinimumABI } from './generated/0.8/GasPriceMinimum'
import { ABI as AccountsABI } from './generated/Accounts'
import { ABI as AttestationsABI } from './generated/Attestations'
import { ABI as BlockchainParametersABI } from './generated/BlockchainParameters'
import { ABI as DoubleSigningSlasherABI } from './generated/DoubleSigningSlasher'
import { ABI as DowntimeSlasherABI } from './generated/DowntimeSlasher'
import { ABI as ElectionABI } from './generated/Election'
import { ABI as EpochRewardsABI } from './generated/EpochRewards'
import { ABI as EscrowABI } from './generated/Escrow'
import { ABI as FederatedAttestationsABI } from './generated/FederatedAttestations'
import { ABI as FeeCurrencyWhitelistABI } from './generated/FeeCurrencyWhitelist'
import { ABI as FeeHandlerABI } from './generated/FeeHandler'
import { ABI as FreezerABI } from './generated/Freezer'
import { ABI as GoldTokenABI } from './generated/GoldToken'
import { ABI as GovernanceABI } from './generated/Governance'
import { ABI as LockedGoldABI } from './generated/LockedGold'
import { ABI as MentoFeeHandlerSellerABI } from './generated/MentoFeeHandlerSeller'
import { ABI as MetaTransactionWalletABI } from './generated/MetaTransactionWallet'
import { ABI as MetaTransactionWalletDeployerABI } from './generated/MetaTransactionWalletDeployer'
import { ABI as MultiSigABI } from './generated/MultiSig'
import { ABI as OdisPaymentsABI } from './generated/OdisPayments'
import { ABI as ProxyABI } from './generated/Proxy'
import { ABI as RandomABI } from './generated/Random'
import { ABI as RegistryABI } from './generated/Registry'
import { ABI as SortedOraclesABI } from './generated/SortedOracles'
import { ABI as UniswapFeeHandlerSellerABI } from './generated/UniswapFeeHandlerSeller'
import { ABI as ValidatorsABI } from './generated/Validators'
import { ABI as ExchangeABI } from './generated/mento/Exchange'
import { ABI as GrandaMentoABI } from './generated/mento/GrandaMento'
import { ABI as ReserveABI } from './generated/mento/Reserve'
import { ABI as StableTokenABI } from './generated/mento/StableToken'

export const GET_IMPLEMENTATION_ABI: ABIDefinition = {
  constant: true,
  inputs: [],
  name: '_getImplementation',
  outputs: [
    {
      name: 'implementation',
      type: 'address',
    },
  ],
  payable: false,
  stateMutability: 'view',
  type: 'function',
  signature: '0x42404e07',
}

export const SET_IMPLEMENTATION_ABI: ABIDefinition = {
  constant: false,
  inputs: [
    {
      name: 'implementation',
      type: 'address',
    },
  ],
  name: '_setImplementation',
  outputs: [],
  payable: false,
  stateMutability: 'nonpayable',
  type: 'function',
  signature: '0xbb913f41',
}

export const SET_AND_INITIALIZE_IMPLEMENTATION_ABI: ABIDefinition = {
  constant: false,
  inputs: [
    {
      name: 'implementation',
      type: 'address',
    },
    {
      name: 'callbackData',
      type: 'bytes',
    },
  ],
  name: '_setAndInitializeImplementation',
  outputs: [],
  payable: true,
  stateMutability: 'payable',
  type: 'function',
  signature: '0x03386ba3',
}

export const PROXY_ABI: ABIDefinition[] = [
  GET_IMPLEMENTATION_ABI,
  SET_IMPLEMENTATION_ABI,
  SET_AND_INITIALIZE_IMPLEMENTATION_ABI,
]

export const PROXY_SET_IMPLEMENTATION_SIGNATURE = SET_IMPLEMENTATION_ABI.signature
export const PROXY_SET_AND_INITIALIZE_IMPLEMENTATION_SIGNATURE =
  SET_AND_INITIALIZE_IMPLEMENTATION_ABI.signature

const findInitializeAbi = (items: AbiItem[]) => items.find((item) => item.name === 'initialize')

const initializeAbiMap = {
  AccountsProxy: findInitializeAbi(AccountsABI),
  AttestationsProxy: findInitializeAbi(AttestationsABI),
  BlockchainParametersProxy: findInitializeAbi(BlockchainParametersABI),
  DoubleSigningSlasherProxy: findInitializeAbi(DoubleSigningSlasherABI),
  DowntimeSlasherProxy: findInitializeAbi(DowntimeSlasherABI),
  ElectionProxy: findInitializeAbi(ElectionABI),
  EpochRewardsProxy: findInitializeAbi(EpochRewardsABI),
  EscrowProxy: findInitializeAbi(EscrowABI),
  ExchangeProxy: findInitializeAbi(ExchangeABI),
  ExchangeEURProxy: findInitializeAbi(ExchangeABI),
  ExchangeBRLProxy: findInitializeAbi(ExchangeABI),
  FederatedAttestationsProxy: findInitializeAbi(FederatedAttestationsABI),
  FeeCurrencyWhitelistProxy: findInitializeAbi(FeeCurrencyWhitelistABI),
  FeeHandlerProxy: findInitializeAbi(FeeHandlerABI),
  MentoFeeHandlerSellerProxy: findInitializeAbi(MentoFeeHandlerSellerABI),
  UniswapFeeHandlerSellerProxy: findInitializeAbi(UniswapFeeHandlerSellerABI),
  FreezerProxy: findInitializeAbi(FreezerABI),
  GasPriceMinimumProxy: findInitializeAbi(GasPriceMinimumABI),
  GoldTokenProxy: findInitializeAbi(GoldTokenABI),
  GovernanceProxy: findInitializeAbi(GovernanceABI),
  GrandaMentoProxy: findInitializeAbi(GrandaMentoABI),
  LockedGoldProxy: findInitializeAbi(LockedGoldABI),
  MetaTransactionWalletProxy: findInitializeAbi(MetaTransactionWalletABI),
  MetaTransactionWalletDeployerProxy: findInitializeAbi(MetaTransactionWalletDeployerABI),
  MultiSigProxy: findInitializeAbi(MultiSigABI),
  OdisPaymentsProxy: findInitializeAbi(OdisPaymentsABI),
  ProxyProxy: findInitializeAbi(ProxyABI),
  RandomProxy: findInitializeAbi(RandomABI),
  RegistryProxy: findInitializeAbi(RegistryABI),
  ReserveProxy: findInitializeAbi(ReserveABI),
  SortedOraclesProxy: findInitializeAbi(SortedOraclesABI),
  StableTokenProxy: findInitializeAbi(StableTokenABI),
  StableTokenEURProxy: findInitializeAbi(StableTokenABI),
  StableTokenBRLProxy: findInitializeAbi(StableTokenABI),
  ValidatorsProxy: findInitializeAbi(ValidatorsABI),
}

export const getInitializeAbiOfImplementation = (
  proxyContractName: keyof typeof initializeAbiMap
) => {
  const initializeAbi = initializeAbiMap[proxyContractName]
  if (!initializeAbi) {
    throw new Error(`Initialize method not found on implementation of ${proxyContractName}`)
  }
  return initializeAbi
}

export const setImplementationOnProxy = (address: string, web3: Web3) => {
  const proxyWeb3Contract = new web3.eth.Contract(PROXY_ABI)
  return proxyWeb3Contract.methods._setImplementation(address)
}
