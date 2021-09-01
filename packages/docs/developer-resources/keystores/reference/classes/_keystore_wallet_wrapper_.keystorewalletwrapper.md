# Class: KeystoreWalletWrapper

Convenience wrapper of the LocalWallet to connect to a keystore

## Hierarchy

* **KeystoreWalletWrapper**

## Index

### Constructors

* [constructor](_keystore_wallet_wrapper_.keystorewalletwrapper.md#constructor)

### Methods

* [getKeystore](_keystore_wallet_wrapper_.keystorewalletwrapper.md#getkeystore)
* [getLocalWallet](_keystore_wallet_wrapper_.keystorewalletwrapper.md#getlocalwallet)
* [importPrivateKey](_keystore_wallet_wrapper_.keystorewalletwrapper.md#importprivatekey)
* [lockAccount](_keystore_wallet_wrapper_.keystorewalletwrapper.md#lockaccount)
* [unlockAccount](_keystore_wallet_wrapper_.keystorewalletwrapper.md#unlockaccount)

## Constructors

###  constructor

\+ **new KeystoreWalletWrapper**(`keystore`: [KeystoreBase](_keystore_base_.keystorebase.md)): *[KeystoreWalletWrapper](_keystore_wallet_wrapper_.keystorewalletwrapper.md)*

*Defined in [keystore-wallet-wrapper.ts:9](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/keystore-wallet-wrapper.ts#L9)*

**Parameters:**

Name | Type |
------ | ------ |
`keystore` | [KeystoreBase](_keystore_base_.keystorebase.md) |

**Returns:** *[KeystoreWalletWrapper](_keystore_wallet_wrapper_.keystorewalletwrapper.md)*

## Methods

###  getKeystore

▸ **getKeystore**(): *[KeystoreBase](_keystore_base_.keystorebase.md)*

*Defined in [keystore-wallet-wrapper.ts:25](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/keystore-wallet-wrapper.ts#L25)*

**Returns:** *[KeystoreBase](_keystore_base_.keystorebase.md)*

___

###  getLocalWallet

▸ **getLocalWallet**(): *LocalWallet*

*Defined in [keystore-wallet-wrapper.ts:21](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/keystore-wallet-wrapper.ts#L21)*

**Returns:** *LocalWallet*

___

###  importPrivateKey

▸ **importPrivateKey**(`privateKey`: string, `passphrase`: string): *Promise‹void›*

*Defined in [keystore-wallet-wrapper.ts:16](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/keystore-wallet-wrapper.ts#L16)*

**Parameters:**

Name | Type |
------ | ------ |
`privateKey` | string |
`passphrase` | string |

**Returns:** *Promise‹void›*

___

###  lockAccount

▸ **lockAccount**(`address`: string): *Promise‹void›*

*Defined in [keystore-wallet-wrapper.ts:34](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/keystore-wallet-wrapper.ts#L34)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |

**Returns:** *Promise‹void›*

___

###  unlockAccount

▸ **unlockAccount**(`address`: string, `passphrase`: string): *Promise‹void›*

*Defined in [keystore-wallet-wrapper.ts:29](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/keystores/src/keystore-wallet-wrapper.ts#L29)*

**Parameters:**

Name | Type |
------ | ------ |
`address` | string |
`passphrase` | string |

**Returns:** *Promise‹void›*
