# WrapperCache

Kit ContractWrappers factory & cache.

Provides access to all contract wrappers for celo core contracts

## Hierarchy

* **WrapperCache**

## Index

### Constructors

* [constructor]()

### Properties

* [kit]()

### Methods

* [getAccounts]()
* [getAttestations]()
* [getBlockchainParameters]()
* [getContract]()
* [getDoubleSigningSlasher]()
* [getDowntimeSlasher]()
* [getElection]()
* [getEscrow]()
* [getExchange]()
* [getFreezer]()
* [getGasPriceMinimum]()
* [getGoldToken]()
* [getGovernance]()
* [getLockedGold]()
* [getMetaTransactionWallet]()
* [getMetaTransactionWalletDeployer]()
* [getMultiSig]()
* [getReserve]()
* [getSortedOracles]()
* [getStableToken]()
* [getValidators]()

## Constructors

### constructor

+ **new WrapperCache**\(`kit`: [ContractKit]()\): [_WrapperCache_]()

_Defined in_ [_contractkit/src/contract-cache.ts:89_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L89)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `kit` | [ContractKit]() |

**Returns:** [_WrapperCache_]()

## Properties

### `Readonly` kit

• **kit**: [_ContractKit_]()

_Defined in_ [_contractkit/src/contract-cache.ts:91_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L91)

## Methods

### getAccounts

▸ **getAccounts**\(\): _Promise‹_[_AccountsWrapper_]()_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:93_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L93)

**Returns:** _Promise‹_[_AccountsWrapper_]()_‹››_

### getAttestations

▸ **getAttestations**\(\): _Promise‹_[_AttestationsWrapper_]()_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:96_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L96)

**Returns:** _Promise‹_[_AttestationsWrapper_]()_‹››_

### getBlockchainParameters

▸ **getBlockchainParameters**\(\): _Promise‹_[_BlockchainParametersWrapper_]()_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:99_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L99)

**Returns:** _Promise‹_[_BlockchainParametersWrapper_]()_‹››_

### getContract

▸ **getContract**&lt;**C**&gt;\(`contract`: C, `address?`: undefined \| string\): _Promise‹NonNullable‹WrapperCacheMap\[C\]››_

_Defined in_ [_contractkit/src/contract-cache.ts:166_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L166)

Get Contract wrapper

**Type parameters:**

▪ **C**: [_ValidWrappers_](_contract_cache_.md#validwrappers)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `contract` | C |
| `address?` | undefined \| string |

**Returns:** _Promise‹NonNullable‹WrapperCacheMap\[C\]››_

### getDoubleSigningSlasher

▸ **getDoubleSigningSlasher**\(\): _Promise‹_[_DoubleSigningSlasherWrapper_]()_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:102_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L102)

**Returns:** _Promise‹_[_DoubleSigningSlasherWrapper_]()_‹››_

### getDowntimeSlasher

▸ **getDowntimeSlasher**\(\): _Promise‹_[_DowntimeSlasherWrapper_]()_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:105_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L105)

**Returns:** _Promise‹_[_DowntimeSlasherWrapper_]()_‹››_

### getElection

▸ **getElection**\(\): _Promise‹_[_ElectionWrapper_]()_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:108_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L108)

**Returns:** _Promise‹_[_ElectionWrapper_]()_‹››_

### getEscrow

▸ **getEscrow**\(\): _Promise‹_[_EscrowWrapper_]()_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:114_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L114)

**Returns:** _Promise‹_[_EscrowWrapper_]()_‹››_

### getExchange

▸ **getExchange**\(\): _Promise‹_[_ExchangeWrapper_]()_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:117_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L117)

**Returns:** _Promise‹_[_ExchangeWrapper_]()_‹››_

### getFreezer

▸ **getFreezer**\(\): _Promise‹_[_FreezerWrapper_]()_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:120_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L120)

**Returns:** _Promise‹_[_FreezerWrapper_]()_‹››_

### getGasPriceMinimum

▸ **getGasPriceMinimum**\(\): _Promise‹_[_GasPriceMinimumWrapper_]()_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:126_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L126)

**Returns:** _Promise‹_[_GasPriceMinimumWrapper_]()_‹››_

### getGoldToken

▸ **getGoldToken**\(\): _Promise‹_[_GoldTokenWrapper_]()_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:129_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L129)

**Returns:** _Promise‹_[_GoldTokenWrapper_]()_‹››_

### getGovernance

▸ **getGovernance**\(\): _Promise‹_[_GovernanceWrapper_]()_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:132_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L132)

**Returns:** _Promise‹_[_GovernanceWrapper_]()_‹››_

### getLockedGold

▸ **getLockedGold**\(\): _Promise‹_[_LockedGoldWrapper_]()_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:135_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L135)

**Returns:** _Promise‹_[_LockedGoldWrapper_]()_‹››_

### getMetaTransactionWallet

▸ **getMetaTransactionWallet**\(`address`: string\): _Promise‹_[_MetaTransactionWalletWrapper_]()_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:138_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L138)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |

**Returns:** _Promise‹_[_MetaTransactionWalletWrapper_]()_‹››_

### getMetaTransactionWalletDeployer

▸ **getMetaTransactionWalletDeployer**\(`address`: string\): _Promise‹_[_MetaTransactionWalletDeployerWrapper_]()_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:141_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L141)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |

**Returns:** _Promise‹_[_MetaTransactionWalletDeployerWrapper_]()_‹››_

### getMultiSig

▸ **getMultiSig**\(`address`: string\): _Promise‹_[_MultiSigWrapper_]()_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:144_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L144)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `address` | string |

**Returns:** _Promise‹_[_MultiSigWrapper_]()_‹››_

### getReserve

▸ **getReserve**\(\): _Promise‹_[_ReserveWrapper_]()_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:150_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L150)

**Returns:** _Promise‹_[_ReserveWrapper_]()_‹››_

### getSortedOracles

▸ **getSortedOracles**\(\): _Promise‹_[_SortedOraclesWrapper_]()_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:153_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L153)

**Returns:** _Promise‹_[_SortedOraclesWrapper_]()_‹››_

### getStableToken

▸ **getStableToken**\(\): _Promise‹_[_StableTokenWrapper_]()_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:156_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L156)

**Returns:** _Promise‹_[_StableTokenWrapper_]()_‹››_

### getValidators

▸ **getValidators**\(\): _Promise‹_[_ValidatorsWrapper_]()_‹››_

_Defined in_ [_contractkit/src/contract-cache.ts:159_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/contract-cache.ts#L159)

**Returns:** _Promise‹_[_ValidatorsWrapper_]()_‹››_

