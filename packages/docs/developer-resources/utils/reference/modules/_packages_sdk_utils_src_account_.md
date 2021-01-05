# Module: "packages/sdk/utils/src/account"

## Index

### References

* [Bip39](_packages_sdk_utils_src_account_.md#bip39)
* [CELO_DERIVATION_PATH_BASE](_packages_sdk_utils_src_account_.md#celo_derivation_path_base)
* [MnemonicLanguages](_packages_sdk_utils_src_account_.md#mnemoniclanguages)
* [MnemonicStrength](_packages_sdk_utils_src_account_.md#mnemonicstrength)
* [RandomNumberGenerator](_packages_sdk_utils_src_account_.md#randomnumbergenerator)

### Functions

* [generateDeterministicInviteCode](_packages_sdk_utils_src_account_.md#generatedeterministicinvitecode)
* [generateKeys](_packages_sdk_utils_src_account_.md#generatekeys)
* [generateKeysFromSeed](_packages_sdk_utils_src_account_.md#generatekeysfromseed)
* [generateMnemonic](_packages_sdk_utils_src_account_.md#generatemnemonic)
* [generateSeed](_packages_sdk_utils_src_account_.md#generateseed)
* [validateMnemonic](_packages_sdk_utils_src_account_.md#validatemnemonic)

### Object literals

* [AccountUtils](_packages_sdk_utils_src_account_.md#const-accountutils)

## References

###  Bip39

• **Bip39**:

___

###  CELO_DERIVATION_PATH_BASE

• **CELO_DERIVATION_PATH_BASE**:

___

###  MnemonicLanguages

• **MnemonicLanguages**:

___

###  MnemonicStrength

• **MnemonicStrength**:

___

###  RandomNumberGenerator

• **RandomNumberGenerator**:

## Functions

###  generateDeterministicInviteCode

▸ **generateDeterministicInviteCode**(`recipientPhoneHash`: string, `recipientPepper`: string, `addressIndex`: number, `changeIndex`: number, `derivationPath`: string): *object*

*Defined in [packages/sdk/utils/src/account.ts:87](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/account.ts#L87)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`recipientPhoneHash` | string | - |
`recipientPepper` | string | - |
`addressIndex` | number | 0 |
`changeIndex` | number | 0 |
`derivationPath` | string | CELO_DERIVATION_PATH_BASE |

**Returns:** *object*

* **privateKey**: *string*

* **publicKey**: *string*

___

###  generateKeys

▸ **generateKeys**(`mnemonic`: string, `password?`: undefined | string, `changeIndex`: number, `addressIndex`: number, `bip39ToUse`: Bip39, `derivationPath`: string): *Promise‹object›*

*Defined in [packages/sdk/utils/src/account.ts:75](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/account.ts#L75)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`mnemonic` | string | - |
`password?` | undefined &#124; string | - |
`changeIndex` | number | 0 |
`addressIndex` | number | 0 |
`bip39ToUse` | Bip39 | bip39Wrapper |
`derivationPath` | string | CELO_DERIVATION_PATH_BASE |

**Returns:** *Promise‹object›*

___

###  generateKeysFromSeed

▸ **generateKeysFromSeed**(`seed`: Buffer, `changeIndex`: number, `addressIndex`: number, `derivationPath`: string): *object*

*Defined in [packages/sdk/utils/src/account.ts:115](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/account.ts#L115)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`seed` | Buffer | - |
`changeIndex` | number | 0 |
`addressIndex` | number | 0 |
`derivationPath` | string | CELO_DERIVATION_PATH_BASE |

**Returns:** *object*

* **address**: *string*

* **privateKey**: *string*

* **publicKey**: *string*

___

###  generateMnemonic

▸ **generateMnemonic**(`strength`: [MnemonicStrength](_packages_sdk_utils_src_account_.md#mnemonicstrength), `language?`: [MnemonicLanguages](_packages_sdk_utils_src_account_.md#mnemoniclanguages), `bip39ToUse`: Bip39): *Promise‹string›*

*Defined in [packages/sdk/utils/src/account.ts:49](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/account.ts#L49)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`strength` | [MnemonicStrength](_packages_sdk_utils_src_account_.md#mnemonicstrength) | MnemonicStrength.s256_24words |
`language?` | [MnemonicLanguages](_packages_sdk_utils_src_account_.md#mnemoniclanguages) | - |
`bip39ToUse` | Bip39 | bip39Wrapper |

**Returns:** *Promise‹string›*

___

###  generateSeed

▸ **generateSeed**(`mnemonic`: string, `password?`: undefined | string, `bip39ToUse`: Bip39, `keyByteLength`: number): *Promise‹Buffer›*

*Defined in [packages/sdk/utils/src/account.ts:100](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/account.ts#L100)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`mnemonic` | string | - |
`password?` | undefined &#124; string | - |
`bip39ToUse` | Bip39 | bip39Wrapper |
`keyByteLength` | number | 64 |

**Returns:** *Promise‹Buffer›*

___

###  validateMnemonic

▸ **validateMnemonic**(`mnemonic`: string, `defaultLanguage?`: [MnemonicLanguages](_packages_sdk_utils_src_account_.md#mnemoniclanguages), `bip39ToUse`: Bip39): *boolean*

*Defined in [packages/sdk/utils/src/account.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/account.ts#L57)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`mnemonic` | string | - |
`defaultLanguage?` | [MnemonicLanguages](_packages_sdk_utils_src_account_.md#mnemoniclanguages) | - |
`bip39ToUse` | Bip39 | bip39Wrapper |

**Returns:** *boolean*

## Object literals

### `Const` AccountUtils

### ▪ **AccountUtils**: *object*

*Defined in [packages/sdk/utils/src/account.ts:171](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/account.ts#L171)*

###  generateKeys

• **generateKeys**: *[generateKeys](_packages_sdk_utils_src_account_.md#generatekeys)*

*Defined in [packages/sdk/utils/src/account.ts:174](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/account.ts#L174)*

###  generateKeysFromSeed

• **generateKeysFromSeed**: *[generateKeysFromSeed](_packages_sdk_utils_src_account_.md#generatekeysfromseed)*

*Defined in [packages/sdk/utils/src/account.ts:176](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/account.ts#L176)*

###  generateMnemonic

• **generateMnemonic**: *[generateMnemonic](_packages_sdk_utils_src_account_.md#generatemnemonic)*

*Defined in [packages/sdk/utils/src/account.ts:172](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/account.ts#L172)*

###  generateSeed

• **generateSeed**: *[generateSeed](_packages_sdk_utils_src_account_.md#generateseed)*

*Defined in [packages/sdk/utils/src/account.ts:175](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/account.ts#L175)*

###  validateMnemonic

• **validateMnemonic**: *[validateMnemonic](_packages_sdk_utils_src_account_.md#validatemnemonic)*

*Defined in [packages/sdk/utils/src/account.ts:173](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/account.ts#L173)*
