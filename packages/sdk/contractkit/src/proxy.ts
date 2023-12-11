// tslint:disable: ordered-imports
import { ABIDefinition, AbiItem } from '@celo/connect'
import Web3 from 'web3'
import { ABI as GasPriceMinimumABI } from '@celo/abis/web3/0.8/GasPriceMinimum'
import { ABI as AccountsABI } from '@celo/abis/web3/Accounts'
import { ABI as AttestationsABI } from '@celo/abis/web3/Attestations'
import { ABI as BlockchainParametersABI } from '@celo/abis/web3/BlockchainParameters'
import { ABI as DoubleSigningSlasherABI } from '@celo/abis/web3/DoubleSigningSlasher'
import { ABI as DowntimeSlasherABI } from '@celo/abis/web3/DowntimeSlasher'
import { ABI as ElectionABI } from '@celo/abis/web3/Election'
import { ABI as EpochRewardsABI } from '@celo/abis/web3/EpochRewards'
import { ABI as EscrowABI } from '@celo/abis/web3/Escrow'
import { ABI as FederatedAttestationsABI } from '@celo/abis/web3/FederatedAttestations'
import { ABI as FeeCurrencyWhitelistABI } from '@celo/abis/web3/FeeCurrencyWhitelist'
import { ABI as FeeHandlerABI } from '@celo/abis/web3/FeeHandler'
import { ABI as FreezerABI } from '@celo/abis/web3/Freezer'
import { ABI as GoldTokenABI } from '@celo/abis/web3/GoldToken'
import { ABI as GovernanceABI } from '@celo/abis/web3/Governance'
import { ABI as LockedGoldABI } from '@celo/abis/web3/LockedGold'
import { ABI as MentoFeeHandlerSellerABI } from '@celo/abis/web3/MentoFeeHandlerSeller'
import { ABI as MultiSigABI } from '@celo/abis/web3/MultiSig'
import { ABI as OdisPaymentsABI } from '@celo/abis/web3/OdisPayments'
import { ABI as ProxyABI } from '@celo/abis/web3/Proxy'
import { ABI as RandomABI } from '@celo/abis/web3/Random'
import { ABI as RegistryABI } from '@celo/abis/web3/Registry'
import { ABI as SortedOraclesABI } from '@celo/abis/web3/SortedOracles'
import { ABI as UniswapFeeHandlerSellerABI } from '@celo/abis/web3/UniswapFeeHandlerSeller'
import { ABI as ValidatorsABI } from '@celo/abis/web3/Validators'
import { ABI as ExchangeABI } from '@celo/abis/web3/mento/Exchange'
import { ABI as ReserveABI } from '@celo/abis/web3/mento/Reserve'
import { ABI as StableTokenABI } from '@celo/abis/web3/mento/StableToken'

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
  LockedGoldProxy: findInitializeAbi(LockedGoldABI),
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
