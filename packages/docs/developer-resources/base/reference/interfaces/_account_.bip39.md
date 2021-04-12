# Interface: Bip39

## Hierarchy

* **Bip39**

## Index

### Properties

* [generateMnemonic](_account_.bip39.md#generatemnemonic)
* [mnemonicToSeed](_account_.bip39.md#mnemonictoseed)
* [mnemonicToSeedSync](_account_.bip39.md#mnemonictoseedsync)
* [validateMnemonic](_account_.bip39.md#validatemnemonic)

## Properties

###  generateMnemonic

• **generateMnemonic**: *function*

*Defined in [packages/sdk/base/src/account.ts:28](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/account.ts#L28)*

#### Type declaration:

▸ (`strength?`: undefined | number, `rng?`: [RandomNumberGenerator](../modules/_account_.md#randomnumbergenerator), `wordlist?`: string[]): *Promise‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`strength?` | undefined &#124; number |
`rng?` | [RandomNumberGenerator](../modules/_account_.md#randomnumbergenerator) |
`wordlist?` | string[] |

___

###  mnemonicToSeed

• **mnemonicToSeed**: *function*

*Defined in [packages/sdk/base/src/account.ts:27](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/account.ts#L27)*

#### Type declaration:

▸ (`mnemonic`: string, `password?`: undefined | string): *Promise‹Buffer›*

**Parameters:**

Name | Type |
------ | ------ |
`mnemonic` | string |
`password?` | undefined &#124; string |

___

###  mnemonicToSeedSync

• **mnemonicToSeedSync**: *function*

*Defined in [packages/sdk/base/src/account.ts:26](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/account.ts#L26)*

#### Type declaration:

▸ (`mnemonic`: string, `password?`: undefined | string): *Buffer*

**Parameters:**

Name | Type |
------ | ------ |
`mnemonic` | string |
`password?` | undefined &#124; string |

___

###  validateMnemonic

• **validateMnemonic**: *function*

*Defined in [packages/sdk/base/src/account.ts:33](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/account.ts#L33)*

#### Type declaration:

▸ (`mnemonic`: string, `wordlist?`: string[]): *boolean*

**Parameters:**

Name | Type |
------ | ------ |
`mnemonic` | string |
`wordlist?` | string[] |
