# packages/sdk/utils/src/account

## Index

### References

* [Bip39](_packages_sdk_utils_src_account_.md#bip39)
* [CELO\_DERIVATION\_PATH\_BASE](_packages_sdk_utils_src_account_.md#celo_derivation_path_base)
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

### Bip39

• **Bip39**:

### CELO\_DERIVATION\_PATH\_BASE

• **CELO\_DERIVATION\_PATH\_BASE**:

### MnemonicLanguages

• **MnemonicLanguages**:

### MnemonicStrength

• **MnemonicStrength**:

### RandomNumberGenerator

• **RandomNumberGenerator**:

## Functions

### formatNonAccentedCharacters

▸ **formatNonAccentedCharacters**\(`mnemonic`: string\): _string_

_Defined in_ [_packages/sdk/utils/src/account.ts:69_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/account.ts#L69)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `mnemonic` | string |

**Returns:** _string_

### generateDeterministicInviteCode

▸ **generateDeterministicInviteCode**\(`recipientPhoneHash`: string, `recipientPepper`: string, `addressIndex`: number, `changeIndex`: number, `derivationPath`: string\): _object_

_Defined in_ [_packages/sdk/utils/src/account.ts:139_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/account.ts#L139)

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `recipientPhoneHash` | string | - |
| `recipientPepper` | string | - |
| `addressIndex` | number | 0 |
| `changeIndex` | number | 0 |
| `derivationPath` | string | CELO\_DERIVATION\_PATH\_BASE |

**Returns:** _object_

* **privateKey**: _string_
* **publicKey**: _string_

### generateKeys

▸ **generateKeys**\(`mnemonic`: string, `password?`: undefined \| string, `changeIndex`: number, `addressIndex`: number, `bip39ToUse`: Bip39, `derivationPath`: string\): _Promise‹object›_

_Defined in_ [_packages/sdk/utils/src/account.ts:127_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/account.ts#L127)

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `mnemonic` | string | - |
| `password?` | undefined \| string | - |
| `changeIndex` | number | 0 |
| `addressIndex` | number | 0 |
| `bip39ToUse` | Bip39 | bip39Wrapper |
| `derivationPath` | string | CELO\_DERIVATION\_PATH\_BASE |

**Returns:** _Promise‹object›_

### generateKeysFromSeed

▸ **generateKeysFromSeed**\(`seed`: Buffer, `changeIndex`: number, `addressIndex`: number, `derivationPath`: string\): _object_

_Defined in_ [_packages/sdk/utils/src/account.ts:167_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/account.ts#L167)

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `seed` | Buffer | - |
| `changeIndex` | number | 0 |
| `addressIndex` | number | 0 |
| `derivationPath` | string | CELO\_DERIVATION\_PATH\_BASE |

**Returns:** _object_

* **address**: _string_
* **privateKey**: _string_
* **publicKey**: _string_

### generateMnemonic

▸ **generateMnemonic**\(`strength`: [MnemonicStrength](_packages_sdk_utils_src_account_.md#mnemonicstrength), `language?`: [MnemonicLanguages](_packages_sdk_utils_src_account_.md#mnemoniclanguages), `bip39ToUse`: Bip39\): _Promise‹string›_

_Defined in_ [_packages/sdk/utils/src/account.ts:50_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/account.ts#L50)

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `strength` | [MnemonicStrength](_packages_sdk_utils_src_account_.md#mnemonicstrength) | MnemonicStrength.s256\_24words |
| `language?` | [MnemonicLanguages](_packages_sdk_utils_src_account_.md#mnemoniclanguages) | - |
| `bip39ToUse` | Bip39 | bip39Wrapper |

**Returns:** _Promise‹string›_

### generateSeed

▸ **generateSeed**\(`mnemonic`: string, `password?`: undefined \| string, `bip39ToUse`: Bip39, `keyByteLength`: number\): _Promise‹Buffer›_

_Defined in_ [_packages/sdk/utils/src/account.ts:152_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/account.ts#L152)

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `mnemonic` | string | - |
| `password?` | undefined \| string | - |
| `bip39ToUse` | Bip39 | bip39Wrapper |
| `keyByteLength` | number | 64 |

**Returns:** _Promise‹Buffer›_

### validateMnemonic

▸ **validateMnemonic**\(`mnemonic`: string, `bip39ToUse`: Bip39\): _boolean_

_Defined in_ [_packages/sdk/utils/src/account.ts:58_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/account.ts#L58)

**Parameters:**

| Name | Type | Default |
| :--- | :--- | :--- |
| `mnemonic` | string | - |
| `bip39ToUse` | Bip39 | bip39Wrapper |

**Returns:** _boolean_

## Object literals

### `Const` AccountUtils

### ▪ **AccountUtils**: _object_

_Defined in_ [_packages/sdk/utils/src/account.ts:235_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/account.ts#L235)

### generateKeys

• **generateKeys**: [_generateKeys_](_packages_sdk_utils_src_account_.md#generatekeys)

_Defined in_ [_packages/sdk/utils/src/account.ts:238_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/account.ts#L238)

### generateKeysFromSeed

• **generateKeysFromSeed**: [_generateKeysFromSeed_](_packages_sdk_utils_src_account_.md#generatekeysfromseed)

_Defined in_ [_packages/sdk/utils/src/account.ts:240_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/account.ts#L240)

### generateMnemonic

• **generateMnemonic**: [_generateMnemonic_](_packages_sdk_utils_src_account_.md#generatemnemonic)

_Defined in_ [_packages/sdk/utils/src/account.ts:236_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/account.ts#L236)

### generateSeed

• **generateSeed**: [_generateSeed_](_packages_sdk_utils_src_account_.md#generateseed)

_Defined in_ [_packages/sdk/utils/src/account.ts:239_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/account.ts#L239)

### validateMnemonic

• **validateMnemonic**: [_validateMnemonic_](_packages_sdk_utils_src_account_.md#validatemnemonic)

_Defined in_ [_packages/sdk/utils/src/account.ts:237_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/utils/src/account.ts#L237)

