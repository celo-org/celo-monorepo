# External module: "base/src/account"

## Index

### Enumerations

* [MnemonicLanguages](../enums/_base_src_account_.mnemoniclanguages.md)
* [MnemonicStrength](../enums/_base_src_account_.mnemonicstrength.md)

### Interfaces

* [Bip39](../interfaces/_base_src_account_.bip39.md)

### Type aliases

* [RandomNumberGenerator](_base_src_account_.md#randomnumbergenerator)

### Variables

* [CELO_DERIVATION_PATH_BASE](_base_src_account_.md#const-celo_derivation_path_base)

## Type aliases

###  RandomNumberGenerator

Ƭ **RandomNumberGenerator**: *function*

*Defined in [packages/base/src/account.ts:19](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/account.ts#L19)*

#### Type declaration:

▸ (`size`: number, `callback`: function): *void*

**Parameters:**

▪ **size**: *number*

▪ **callback**: *function*

▸ (`err`: [Error](../classes/_base_src_result_.rooterror.md#static-error) | null, `buf`: Buffer): *void*

**Parameters:**

Name | Type |
------ | ------ |
`err` | [Error](../classes/_base_src_result_.rooterror.md#static-error) &#124; null |
`buf` | Buffer |

## Variables

### `Const` CELO_DERIVATION_PATH_BASE

• **CELO_DERIVATION_PATH_BASE**: *"m/44'/52752'/0'"* = "m/44'/52752'/0'"

*Defined in [packages/base/src/account.ts:1](https://github.com/celo-org/celo-monorepo/blob/master/packages/base/src/account.ts#L1)*
