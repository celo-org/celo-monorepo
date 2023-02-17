[@celo/cryptographic-utils](../README.md) › [Globals](../globals.md) › ["packages/sdk/cryptographic-utils/src/account"](_packages_sdk_cryptographic_utils_src_account_.md)

# Module: "packages/sdk/cryptographic-utils/src/account"

## Index

### References

* [Bip39](_packages_sdk_cryptographic_utils_src_account_.md#bip39)
* [CELO_DERIVATION_PATH_BASE](_packages_sdk_cryptographic_utils_src_account_.md#celo_derivation_path_base)
* [MnemonicLanguages](_packages_sdk_cryptographic_utils_src_account_.md#mnemoniclanguages)
* [MnemonicStrength](_packages_sdk_cryptographic_utils_src_account_.md#mnemonicstrength)
* [RandomNumberGenerator](_packages_sdk_cryptographic_utils_src_account_.md#randomnumbergenerator)

### Functions

* [detectMnemonicLanguage](_packages_sdk_cryptographic_utils_src_account_.md#detectmnemoniclanguage)
* [formatNonAccentedCharacters](_packages_sdk_cryptographic_utils_src_account_.md#formatnonaccentedcharacters)
* [generateDeterministicInviteCode](_packages_sdk_cryptographic_utils_src_account_.md#generatedeterministicinvitecode)
* [generateKeys](_packages_sdk_cryptographic_utils_src_account_.md#generatekeys)
* [generateKeysFromSeed](_packages_sdk_cryptographic_utils_src_account_.md#generatekeysfromseed)
* [generateMnemonic](_packages_sdk_cryptographic_utils_src_account_.md#generatemnemonic)
* [generateSeed](_packages_sdk_cryptographic_utils_src_account_.md#generateseed)
* [getAllLanguages](_packages_sdk_cryptographic_utils_src_account_.md#getalllanguages)
* [invalidMnemonicWords](_packages_sdk_cryptographic_utils_src_account_.md#invalidmnemonicwords)
* [mnemonicLengthFromStrength](_packages_sdk_cryptographic_utils_src_account_.md#mnemoniclengthfromstrength)
* [normalizeMnemonic](_packages_sdk_cryptographic_utils_src_account_.md#normalizemnemonic)
* [suggestMnemonicCorrections](_packages_sdk_cryptographic_utils_src_account_.md#suggestmnemoniccorrections)
* [validateMnemonic](_packages_sdk_cryptographic_utils_src_account_.md#validatemnemonic)

### Object literals

* [AccountUtils](_packages_sdk_cryptographic_utils_src_account_.md#const-accountutils)

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

###  detectMnemonicLanguage

▸ **detectMnemonicLanguage**(`words`: string[], `candidates?`: [MnemonicLanguages](_packages_sdk_cryptographic_utils_src_account_.md#mnemoniclanguages)[]): *[MnemonicLanguages](_packages_sdk_cryptographic_utils_src_account_.md#mnemoniclanguages) | undefined*

*Defined in [packages/sdk/cryptographic-utils/src/account.ts:230](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/account.ts#L230)*

Detects the language of tokenized mnemonic phrase by applying a heuristic.

**`remarks`** Uses a heuristic of returning the language with the most matching words. In practice, we
expect all words to come from a single language, also some may be misspelled or otherwise
malformed. It may occasionally occur that a typo results in word from another language (e.g. bag
-> bagr) but this should occur at most once or twice per phrase.

**Parameters:**

Name | Type |
------ | ------ |
`words` | string[] |
`candidates?` | [MnemonicLanguages](_packages_sdk_cryptographic_utils_src_account_.md#mnemoniclanguages)[] |

**Returns:** *[MnemonicLanguages](_packages_sdk_cryptographic_utils_src_account_.md#mnemoniclanguages) | undefined*

___

###  formatNonAccentedCharacters

▸ **formatNonAccentedCharacters**(`mnemonic`: string): *string*

*Defined in [packages/sdk/cryptographic-utils/src/account.ts:156](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/account.ts#L156)*

**`deprecated`** now an alias for normalizeMnemonic.

**Parameters:**

Name | Type |
------ | ------ |
`mnemonic` | string |

**Returns:** *string*

___

###  generateDeterministicInviteCode

▸ **generateDeterministicInviteCode**(`recipientPhoneHash`: string, `recipientPepper`: string, `addressIndex`: number, `changeIndex`: number, `derivationPath`: string): *object*

*Defined in [packages/sdk/cryptographic-utils/src/account.ts:412](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/account.ts#L412)*

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

*Defined in [packages/sdk/cryptographic-utils/src/account.ts:400](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/account.ts#L400)*

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

*Defined in [packages/sdk/cryptographic-utils/src/account.ts:440](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/account.ts#L440)*

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

▸ **generateMnemonic**(`strength`: [MnemonicStrength](_packages_sdk_cryptographic_utils_src_account_.md#mnemonicstrength), `language?`: [MnemonicLanguages](_packages_sdk_cryptographic_utils_src_account_.md#mnemoniclanguages), `bip39ToUse`: Bip39): *Promise‹string›*

*Defined in [packages/sdk/cryptographic-utils/src/account.ts:51](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/account.ts#L51)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`strength` | [MnemonicStrength](_packages_sdk_cryptographic_utils_src_account_.md#mnemonicstrength) | MnemonicStrength.s256_24words |
`language?` | [MnemonicLanguages](_packages_sdk_cryptographic_utils_src_account_.md#mnemoniclanguages) | - |
`bip39ToUse` | Bip39 | bip39Wrapper |

**Returns:** *Promise‹string›*

___

###  generateSeed

▸ **generateSeed**(`mnemonic`: string, `password?`: undefined | string, `bip39ToUse`: Bip39, `keyByteLength`: number): *Promise‹Buffer›*

*Defined in [packages/sdk/cryptographic-utils/src/account.ts:425](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/account.ts#L425)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`mnemonic` | string | - |
`password?` | undefined &#124; string | - |
`bip39ToUse` | Bip39 | bip39Wrapper |
`keyByteLength` | number | 64 |

**Returns:** *Promise‹Buffer›*

___

###  getAllLanguages

▸ **getAllLanguages**(): *[MnemonicLanguages](_packages_sdk_cryptographic_utils_src_account_.md#mnemoniclanguages)[]*

*Defined in [packages/sdk/cryptographic-utils/src/account.ts:185](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/account.ts#L185)*

**Returns:** *[MnemonicLanguages](_packages_sdk_cryptographic_utils_src_account_.md#mnemoniclanguages)[]*

___

###  invalidMnemonicWords

▸ **invalidMnemonicWords**(`mnemonic`: string, `language?`: [MnemonicLanguages](_packages_sdk_cryptographic_utils_src_account_.md#mnemoniclanguages)): *string[] | undefined*

*Defined in [packages/sdk/cryptographic-utils/src/account.ts:85](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/account.ts#L85)*

Return a list of the words in the mnemonic that are not in the list of valid BIP-39 words for the
specified or detected language.

**`remarks`** Will return undefined if the language cannot be detected (e.g.  all the words are
invalid, or half of the valid words are from one language and the other half from another.)

**Parameters:**

Name | Type |
------ | ------ |
`mnemonic` | string |
`language?` | [MnemonicLanguages](_packages_sdk_cryptographic_utils_src_account_.md#mnemoniclanguages) |

**Returns:** *string[] | undefined*

___

###  mnemonicLengthFromStrength

▸ **mnemonicLengthFromStrength**(`strength`: [MnemonicStrength](_packages_sdk_cryptographic_utils_src_account_.md#mnemonicstrength)): *number*

*Defined in [packages/sdk/cryptographic-utils/src/account.ts:199](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/account.ts#L199)*

**Parameters:**

Name | Type |
------ | ------ |
`strength` | [MnemonicStrength](_packages_sdk_cryptographic_utils_src_account_.md#mnemonicstrength) |

**Returns:** *number*

___

###  normalizeMnemonic

▸ **normalizeMnemonic**(`mnemonic`: string, `language?`: [MnemonicLanguages](_packages_sdk_cryptographic_utils_src_account_.md#mnemoniclanguages)): *string*

*Defined in [packages/sdk/cryptographic-utils/src/account.ts:106](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/account.ts#L106)*

Normalize the mnemonic phrase to eliminate a number of inconsistencies with standard BIP-39
phrases that are likely to arise when a user manually enters a phrase.

**`remarks`** Note that this does not guarantee that the output is a valid mnemonic phrase, or even
that all the words in the phrase are contained in a valid wordlist.

**Parameters:**

Name | Type |
------ | ------ |
`mnemonic` | string |
`language?` | [MnemonicLanguages](_packages_sdk_cryptographic_utils_src_account_.md#mnemoniclanguages) |

**Returns:** *string*

___

###  suggestMnemonicCorrections

▸ **suggestMnemonicCorrections**(`mnemonic`: string, `language?`: [MnemonicLanguages](_packages_sdk_cryptographic_utils_src_account_.md#mnemoniclanguages), `strength?`: [MnemonicStrength](_packages_sdk_cryptographic_utils_src_account_.md#mnemonicstrength)): *Generator‹string›*

*Defined in [packages/sdk/cryptographic-utils/src/account.ts:285](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/account.ts#L285)*

Generates a list of suggested corrections to the mnemonic phrase based on a set of heuristics.

**`remarks`** 
Each yielded suggestion represents an attempt to correct the seed phrase by replacing any invalid
words with the most likely valid words. Returned suggestions phrases are ordered by probability
based on a noisy channel model, described in detail in CIP-39.

The generated list of suggestions is exponential in size, and effectively infinite. One should
not attempt to generate the entire list.

All yielded suggestions will have a valid checksum, but are not guaranteed to correspond to any
given wallet. If the phrase is being used to recover a wallet with non-zero balance, it is
suggested that the caller check the balance of the derived wallet address. If the balance is
non-zero, they can be sure that the phrase is correct. If it is zero, then they should continue
and try the next suggestion.

It is recommended to normalize the mnemonic phrase before inputting to this function.

**`privateremarks`** 
TODO(victor): Include a heuristic rule for phrase-level corrections, such as word ordering swaps.

**Parameters:**

Name | Type |
------ | ------ |
`mnemonic` | string |
`language?` | [MnemonicLanguages](_packages_sdk_cryptographic_utils_src_account_.md#mnemoniclanguages) |
`strength?` | [MnemonicStrength](_packages_sdk_cryptographic_utils_src_account_.md#mnemonicstrength) |

**Returns:** *Generator‹string›*

___

###  validateMnemonic

▸ **validateMnemonic**(`mnemonic`: string, `bip39ToUse`: Bip39, `language?`: [MnemonicLanguages](_packages_sdk_cryptographic_utils_src_account_.md#mnemoniclanguages)): *boolean*

*Defined in [packages/sdk/cryptographic-utils/src/account.ts:59](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/account.ts#L59)*

**Parameters:**

Name | Type | Default |
------ | ------ | ------ |
`mnemonic` | string | - |
`bip39ToUse` | Bip39 | bip39Wrapper |
`language?` | [MnemonicLanguages](_packages_sdk_cryptographic_utils_src_account_.md#mnemoniclanguages) | - |

**Returns:** *boolean*

## Object literals

### `Const` AccountUtils

### ▪ **AccountUtils**: *object*

*Defined in [packages/sdk/cryptographic-utils/src/account.ts:461](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/account.ts#L461)*

###  detectMnemonicLanguage

• **detectMnemonicLanguage**: *[detectMnemonicLanguage](_packages_sdk_cryptographic_utils_src_account_.md#detectmnemoniclanguage)*

*Defined in [packages/sdk/cryptographic-utils/src/account.ts:462](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/account.ts#L462)*

###  generateKeys

• **generateKeys**: *[generateKeys](_packages_sdk_cryptographic_utils_src_account_.md#generatekeys)*

*Defined in [packages/sdk/cryptographic-utils/src/account.ts:468](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/account.ts#L468)*

###  generateKeysFromSeed

• **generateKeysFromSeed**: *[generateKeysFromSeed](_packages_sdk_cryptographic_utils_src_account_.md#generatekeysfromseed)*

*Defined in [packages/sdk/cryptographic-utils/src/account.ts:470](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/account.ts#L470)*

###  generateMnemonic

• **generateMnemonic**: *[generateMnemonic](_packages_sdk_cryptographic_utils_src_account_.md#generatemnemonic)*

*Defined in [packages/sdk/cryptographic-utils/src/account.ts:463](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/account.ts#L463)*

###  generateSeed

• **generateSeed**: *[generateSeed](_packages_sdk_cryptographic_utils_src_account_.md#generateseed)*

*Defined in [packages/sdk/cryptographic-utils/src/account.ts:469](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/account.ts#L469)*

###  invalidMnemonicWords

• **invalidMnemonicWords**: *[invalidMnemonicWords](_packages_sdk_cryptographic_utils_src_account_.md#invalidmnemonicwords)*

*Defined in [packages/sdk/cryptographic-utils/src/account.ts:466](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/account.ts#L466)*

###  normalizeMnemonic

• **normalizeMnemonic**: *[normalizeMnemonic](_packages_sdk_cryptographic_utils_src_account_.md#normalizemnemonic)*

*Defined in [packages/sdk/cryptographic-utils/src/account.ts:464](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/account.ts#L464)*

###  suggestMnemonicCorrections

• **suggestMnemonicCorrections**: *[suggestMnemonicCorrections](_packages_sdk_cryptographic_utils_src_account_.md#suggestmnemoniccorrections)*

*Defined in [packages/sdk/cryptographic-utils/src/account.ts:467](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/account.ts#L467)*

###  validateMnemonic

• **validateMnemonic**: *[validateMnemonic](_packages_sdk_cryptographic_utils_src_account_.md#validatemnemonic)*

*Defined in [packages/sdk/cryptographic-utils/src/account.ts:465](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/cryptographic-utils/src/account.ts#L465)*
