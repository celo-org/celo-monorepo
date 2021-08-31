# Bip39

## Hierarchy

* **Bip39**

## Index

### Properties

* [generateMnemonic]()
* [mnemonicToSeed]()
* [mnemonicToSeedSync]()
* [validateMnemonic]()

## Properties

### generateMnemonic

• **generateMnemonic**: _function_

_Defined in_ [_packages/sdk/base/src/account.ts:28_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/account.ts#L28)

#### Type declaration:

▸ \(`strength?`: undefined \| number, `rng?`: [RandomNumberGenerator](_account_.md#randomnumbergenerator), `wordlist?`: string\[\]\): _Promise‹string›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `strength?` | undefined \| number |
| `rng?` | [RandomNumberGenerator](_account_.md#randomnumbergenerator) |
| `wordlist?` | string\[\] |

### mnemonicToSeed

• **mnemonicToSeed**: _function_

_Defined in_ [_packages/sdk/base/src/account.ts:27_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/account.ts#L27)

#### Type declaration:

▸ \(`mnemonic`: string, `password?`: undefined \| string\): _Promise‹Buffer›_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `mnemonic` | string |
| `password?` | undefined \| string |

### mnemonicToSeedSync

• **mnemonicToSeedSync**: _function_

_Defined in_ [_packages/sdk/base/src/account.ts:26_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/account.ts#L26)

#### Type declaration:

▸ \(`mnemonic`: string, `password?`: undefined \| string\): _Buffer_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `mnemonic` | string |
| `password?` | undefined \| string |

### validateMnemonic

• **validateMnemonic**: _function_

_Defined in_ [_packages/sdk/base/src/account.ts:33_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/base/src/account.ts#L33)

#### Type declaration:

▸ \(`mnemonic`: string, `wordlist?`: string\[\]\): _boolean_

**Parameters:**

| Name | Type |
| :--- | :--- |
| `mnemonic` | string |
| `wordlist?` | string\[\] |

