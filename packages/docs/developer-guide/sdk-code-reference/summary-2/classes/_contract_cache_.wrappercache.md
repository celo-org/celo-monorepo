# WrapperCache

Kit ContractWrappers factory & cache.

Provides access to all contract wrappers for celo core contracts

## Hierarchy

* **WrapperCache**

## Index

### Constructors

* [constructor](_contract_cache_.wrappercache.md#constructor)

### Properties

* [kit](_contract_cache_.wrappercache.md#readonly-kit)

### Methods

* [getAccounts](_contract_cache_.wrappercache.md#getaccounts)
* [getAttestations](_contract_cache_.wrappercache.md#getattestations)
* [getBlockchainParameters](_contract_cache_.wrappercache.md#getblockchainparameters)
* [getContract](_contract_cache_.wrappercache.md#getcontract)
* [getDoubleSigningSlasher](_contract_cache_.wrappercache.md#getdoublesigningslasher)
* [getDowntimeSlasher](_contract_cache_.wrappercache.md#getdowntimeslasher)
* [getElection](_contract_cache_.wrappercache.md#getelection)
* [getEscrow](_contract_cache_.wrappercache.md#getescrow)
* [getExchange](_contract_cache_.wrappercache.md#getexchange)
* [getFreezer](_contract_cache_.wrappercache.md#getfreezer)
* [getGasPriceMinimum](_contract_cache_.wrappercache.md#getgaspriceminimum)
* [getGoldToken](_contract_cache_.wrappercache.md#getgoldtoken)
* [getGovernance](_contract_cache_.wrappercache.md#getgovernance)
* [getLockedGold](_contract_cache_.wrappercache.md#getlockedgold)
* [getMetaTransactionWallet](_contract_cache_.wrappercache.md#getmetatransactionwallet)
* [getMetaTransactionWalletDeployer](_contract_cache_.wrappercache.md#getmetatransactionwalletdeployer)
* [getMultiSig](_contract_cache_.wrappercache.md#getmultisig)
* [getReserve](_contract_cache_.wrappercache.md#getreserve)
* [getSortedOracles](_contract_cache_.wrappercache.md#getsortedoracles)
* [getStableToken](_contract_cache_.wrappercache.md#getstabletoken)
* [getValidators](_contract_cache_.wrappercache.md#getvalidators)

## Constructors

### constructor

+ **new WrapperCache**\(`kit`: [ContractKit](_kit_.contractkit.md)\): [_WrapperCache_](_contract_cache_.wrappercache.md)

_Defined in_ [_contractkit/src/contract-cache.ts:89_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L89)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit](_kit_.contractkit.md) |

**Returns:** [_WrapperCache_](_contract_cache_.wrappercache.md)

## Properties

### `Readonly` kit

• **kit**: [_ContractKit_](_kit_.contractkit.md)

_Defined in_ [_contractkit/src/contract-cache.ts:91_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L91)

## Methods

### getAccounts

▸ **getAccounts**\(\): _Promise‹_[_AccountsWrapper_](_wrappers_accounts_.accountswrapper.md)_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:93_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L93)

**Returns:** _Promise‹_[_AccountsWrapper_](_wrappers_accounts_.accountswrapper.md)_‹››_

### getAttestations

▸ **getAttestations**\(\): _Promise‹_[_AttestationsWrapper_](_wrappers_attestations_.attestationswrapper.md)_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:96_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L96)

**Returns:** _Promise‹_[_AttestationsWrapper_](_wrappers_attestations_.attestationswrapper.md)_‹››_

### getBlockchainParameters

▸ **getBlockchainParameters**\(\): _Promise‹_[_BlockchainParametersWrapper_](_wrappers_blockchainparameters_.blockchainparameterswrapper.md)_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:99_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L99)

**Returns:** _Promise‹_[_BlockchainParametersWrapper_](_wrappers_blockchainparameters_.blockchainparameterswrapper.md)_‹››_

### getContract

▸ **getContract**&lt;**C**&gt;\(`contract`: C, `address?`: undefined \| string\): _Promise‹NonNullable‹WrapperCacheMap\[C\]››_

_Defined in_ [_contractkit/src/contract-cache.ts:166_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L166)

Get Contract wrapper

**Type parameters:**

▪ **C**: [_ValidWrappers_](../modules/_contract_cache_.md#validwrappers)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `contract` | C |
| `address?` | undefined \| string |

**Returns:** _Promise‹NonNullable‹WrapperCacheMap\[C\]››_

### getDoubleSigningSlasher

▸ **getDoubleSigningSlasher**\(\): _Promise‹_[_DoubleSigningSlasherWrapper_](_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md)_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:102_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L102)

**Returns:** _Promise‹_[_DoubleSigningSlasherWrapper_](_wrappers_doublesigningslasher_.doublesigningslasherwrapper.md)_‹››_

### getDowntimeSlasher

▸ **getDowntimeSlasher**\(\): _Promise‹_[_DowntimeSlasherWrapper_](_wrappers_downtimeslasher_.downtimeslasherwrapper.md)_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:105_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L105)

**Returns:** _Promise‹_[_DowntimeSlasherWrapper_](_wrappers_downtimeslasher_.downtimeslasherwrapper.md)_‹››_

### getElection

▸ **getElection**\(\): _Promise‹_[_ElectionWrapper_](_wrappers_election_.electionwrapper.md)_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:108_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L108)

**Returns:** _Promise‹_[_ElectionWrapper_](_wrappers_election_.electionwrapper.md)_‹››_

### getEscrow

▸ **getEscrow**\(\): _Promise‹_[_EscrowWrapper_](_wrappers_escrow_.escrowwrapper.md)_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:114_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L114)

**Returns:** _Promise‹_[_EscrowWrapper_](_wrappers_escrow_.escrowwrapper.md)_‹››_

### getExchange

▸ **getExchange**\(\): _Promise‹_[_ExchangeWrapper_](_wrappers_exchange_.exchangewrapper.md)_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:117_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L117)

**Returns:** _Promise‹_[_ExchangeWrapper_](_wrappers_exchange_.exchangewrapper.md)_‹››_

### getFreezer

▸ **getFreezer**\(\): _Promise‹_[_FreezerWrapper_](_wrappers_freezer_.freezerwrapper.md)_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:120_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L120)

**Returns:** _Promise‹_[_FreezerWrapper_](_wrappers_freezer_.freezerwrapper.md)_‹››_

### getGasPriceMinimum

▸ **getGasPriceMinimum**\(\): _Promise‹_[_GasPriceMinimumWrapper_](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md)_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:126_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L126)

**Returns:** _Promise‹_[_GasPriceMinimumWrapper_](_wrappers_gaspriceminimum_.gaspriceminimumwrapper.md)_‹››_

### getGoldToken

▸ **getGoldToken**\(\): _Promise‹_[_GoldTokenWrapper_](_wrappers_goldtokenwrapper_.goldtokenwrapper.md)_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:129_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L129)

**Returns:** _Promise‹_[_GoldTokenWrapper_](_wrappers_goldtokenwrapper_.goldtokenwrapper.md)_‹››_

### getGovernance

▸ **getGovernance**\(\): _Promise‹_[_GovernanceWrapper_](_wrappers_governance_.governancewrapper.md)_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:132_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L132)

**Returns:** _Promise‹_[_GovernanceWrapper_](_wrappers_governance_.governancewrapper.md)_‹››_

### getLockedGold

▸ **getLockedGold**\(\): _Promise‹_[_LockedGoldWrapper_](_wrappers_lockedgold_.lockedgoldwrapper.md)_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:135_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L135)

**Returns:** _Promise‹_[_LockedGoldWrapper_](_wrappers_lockedgold_.lockedgoldwrapper.md)_‹››_

### getMetaTransactionWallet

▸ **getMetaTransactionWallet**\(`address`: string\): _Promise‹_[_MetaTransactionWalletWrapper_](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md)_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:138_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L138)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |

**Returns:** _Promise‹_[_MetaTransactionWalletWrapper_](_wrappers_metatransactionwallet_.metatransactionwalletwrapper.md)_‹››_

### getMetaTransactionWalletDeployer

▸ **getMetaTransactionWalletDeployer**\(`address`: string\): _Promise‹_[_MetaTransactionWalletDeployerWrapper_](_wrappers_metatransactionwalletdeployer_.metatransactionwalletdeployerwrapper.md)_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:141_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L141)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |

**Returns:** _Promise‹_[_MetaTransactionWalletDeployerWrapper_](_wrappers_metatransactionwalletdeployer_.metatransactionwalletdeployerwrapper.md)_‹››_

### getMultiSig

▸ **getMultiSig**\(`address`: string\): _Promise‹_[_MultiSigWrapper_](_wrappers_multisig_.multisigwrapper.md)_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:144_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L144)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |

**Returns:** _Promise‹_[_MultiSigWrapper_](_wrappers_multisig_.multisigwrapper.md)_‹››_

### getReserve

▸ **getReserve**\(\): _Promise‹_[_ReserveWrapper_](_wrappers_reserve_.reservewrapper.md)_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:150_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L150)

**Returns:** _Promise‹_[_ReserveWrapper_](_wrappers_reserve_.reservewrapper.md)_‹››_

### getSortedOracles

▸ **getSortedOracles**\(\): _Promise‹_[_SortedOraclesWrapper_](_wrappers_sortedoracles_.sortedoracleswrapper.md)_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:153_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L153)

**Returns:** _Promise‹_[_SortedOraclesWrapper_](_wrappers_sortedoracles_.sortedoracleswrapper.md)_‹››_

### getStableToken

▸ **getStableToken**\(\): _Promise‹_[_StableTokenWrapper_](_wrappers_stabletokenwrapper_.stabletokenwrapper.md)_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:156_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L156)

**Returns:** _Promise‹_[_StableTokenWrapper_](_wrappers_stabletokenwrapper_.stabletokenwrapper.md)_‹››_

### getValidators

▸ **getValidators**\(\): _Promise‹_[_ValidatorsWrapper_](_wrappers_validators_.validatorswrapper.md)_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:159_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L159)

**Returns:** _Promise‹_[_ValidatorsWrapper_](_wrappers_validators_.validatorswrapper.md)_‹››_

