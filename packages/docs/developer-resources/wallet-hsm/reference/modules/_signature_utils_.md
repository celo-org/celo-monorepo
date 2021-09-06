# Module: "signature-utils"

## Index

### Classes

* [Signature](../classes/_signature_utils_.signature.md)

### Variables

* [publicKeyPrefix](_signature_utils_.md#const-publickeyprefix)
* [sixtyFour](_signature_utils_.md#const-sixtyfour)
* [thirtyTwo](_signature_utils_.md#const-thirtytwo)

### Functions

* [bigNumberToBuffer](_signature_utils_.md#const-bignumbertobuffer)
* [bufferToBigNumber](_signature_utils_.md#const-buffertobignumber)
* [getAddressFromPublicKey](_signature_utils_.md#getaddressfrompublickey)
* [makeCanonical](_signature_utils_.md#const-makecanonical)
* [recoverKeyIndex](_signature_utils_.md#recoverkeyindex)

## Variables

### `Const` publicKeyPrefix

• **publicKeyPrefix**: *number* = 4

*Defined in [signature-utils.ts:9](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm/src/signature-utils.ts#L9)*

___

### `Const` sixtyFour

• **sixtyFour**: *number* = 64

*Defined in [signature-utils.ts:10](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm/src/signature-utils.ts#L10)*

___

### `Const` thirtyTwo

• **thirtyTwo**: *number* = 32

*Defined in [signature-utils.ts:11](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm/src/signature-utils.ts#L11)*

## Functions

### `Const` bigNumberToBuffer

▸ **bigNumberToBuffer**(`input`: BigNumber, `lengthInBytes`: number): *Buffer*

*Defined in [signature-utils.ts:34](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm/src/signature-utils.ts#L34)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | BigNumber |
`lengthInBytes` | number |

**Returns:** *Buffer*

___

### `Const` bufferToBigNumber

▸ **bufferToBigNumber**(`input`: Buffer): *BigNumber*

*Defined in [signature-utils.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm/src/signature-utils.ts#L30)*

**Parameters:**

Name | Type |
------ | ------ |
`input` | Buffer |

**Returns:** *BigNumber*

___

###  getAddressFromPublicKey

▸ **getAddressFromPublicKey**(`publicKey`: BigNumber): *Address*

*Defined in [signature-utils.ts:78](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm/src/signature-utils.ts#L78)*

**Parameters:**

Name | Type |
------ | ------ |
`publicKey` | BigNumber |

**Returns:** *Address*

___

### `Const` makeCanonical

▸ **makeCanonical**(`S`: BigNumber): *BigNumber*

*Defined in [signature-utils.ts:21](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm/src/signature-utils.ts#L21)*

If the signature is in the "bottom" of the curve, it is non-canonical
Non-canonical signatures are illegal in Ethereum and therefore the S value
must be transposed to the lower intersection
https://github.com/bitcoin/bips/blob/master/bip-0062.mediawiki#Low_S_values_in_signatures

**Parameters:**

Name | Type |
------ | ------ |
`S` | BigNumber |

**Returns:** *BigNumber*

___

###  recoverKeyIndex

▸ **recoverKeyIndex**(`signature`: Uint8Array, `publicKey`: BigNumber, `hash`: Uint8Array): *number*

*Defined in [signature-utils.ts:58](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm/src/signature-utils.ts#L58)*

Attempts each recovery key to find a match

**Parameters:**

Name | Type |
------ | ------ |
`signature` | Uint8Array |
`publicKey` | BigNumber |
`hash` | Uint8Array |

**Returns:** *number*
