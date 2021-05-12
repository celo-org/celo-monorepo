# Module: "packages/sdk/utils/src/account"

## Index

### References

* [Bip39](_packages_sdk_utils_src_account_.md#bip39)
* [CELO_DERIVATION_PATH_BASE](_packages_sdk_utils_src_account_.md#celo_derivation_path_base)
* [MnemonicLanguages](_packages_sdk_utils_src_account_.md#mnemoniclanguages)
* [MnemonicStrength](_packages_sdk_utils_src_account_.md#mnemonicstrength)
* [RandomNumberGenerator](_packages_sdk_utils_src_account_.md#randomnumbergenerator)

### Functions

* [formatNonAccentedCharacters](_packages_sdk_utils_src_account_.md#formatnonaccentedcharacters)
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

###  formatNonAccentedCharacters

▸ **formatNonAccentedCharacters**(`mnemonic`: string): *string*

*Defined in [packages/sdk/utils/src/account.ts:69](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/account.ts#L69)*

**Parameters:**

Name | Type |
------ | ------ |
`mnemonic` | string |

**Returns:** *string*

___

###  generateDeterministicInviteCode

▸ **generateDeterministicInviteCode**(`recipientPhoneHash`: string, `recipientPepper`: string, `addressIndex`: number, `changeIndex`: number, `derivationPath`: string): *object*

*Defined in [packages/sdk/utils/src/account.ts:139](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/account.ts#L139)*

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

*Defined in [packages/sdk/utils/src/account.ts:127](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/account.ts#L127)*

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

*Defined in [packages/sdk/utils/src/account.ts:167](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/account.ts#L167)*

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

*Defined in [packages/sdk/utils/src/account.ts:50](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/account.ts#L50)*

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

*Defined in [packages/sdk/utils/src/account.ts:152](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/account.ts#L152)*

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

▸ **validateMnemonic**(`mnemonic`: string, `bip39ToUse`: Bip39): *boolean*

*Defined in [packages/sdk/utils/src/account.ts:58](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/account.ts#L58)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`mnemonic` | string | - |
`bip39ToUse` | Bip39 | bip39Wrapper |

**Returns:** *boolean*

## Object literals

### `Const` AccountUtils

### ▪ **AccountUtils**: *object*

*Defined in [packages/sdk/utils/src/account.ts:235](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/account.ts#L235)*

###  generateKeys

• **generateKeys**: *[generateKeys](_packages_sdk_utils_src_account_.md#generatekeys)*

*Defined in [packages/sdk/utils/src/account.ts:238](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/account.ts#L238)*

###  generateKeysFromSeed

• **generateKeysFromSeed**: *[generateKeysFromSeed](_packages_sdk_utils_src_account_.md#generatekeysfromseed)*

*Defined in [packages/sdk/utils/src/account.ts:240](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/account.ts#L240)*

###  generateMnemonic

• **generateMnemonic**: *[generateMnemonic](_packages_sdk_utils_src_account_.md#generatemnemonic)*

*Defined in [packages/sdk/utils/src/account.ts:236](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/account.ts#L236)*

###  generateSeed

• **generateSeed**: *[generateSeed](_packages_sdk_utils_src_account_.md#generateseed)*

*Defined in [packages/sdk/utils/src/account.ts:239](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/account.ts#L239)*

###  validateMnemonic

• **validateMnemonic**: *[validateMnemonic](_packages_sdk_utils_src_account_.md#validatemnemonic)*

*Defined in [packages/sdk/utils/src/account.ts:237](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/account.ts#L237)*
