# signature-utils

## Index

### Classes

* [Signature]()

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

• **publicKeyPrefix**: _number_ = 4

_Defined in_ [_signature-utils.ts:9_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm/src/signature-utils.ts#L9)

### `Const` sixtyFour

• **sixtyFour**: _number_ = 64

_Defined in_ [_signature-utils.ts:10_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm/src/signature-utils.ts#L10)

### `Const` thirtyTwo

• **thirtyTwo**: _number_ = 32

_Defined in_ [_signature-utils.ts:11_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm/src/signature-utils.ts#L11)

## Functions

### `Const` bigNumberToBuffer

▸ **bigNumberToBuffer**\(`input`: BigNumber, `lengthInBytes`: number\): _Buffer_

_Defined in_ [_signature-utils.ts:34_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm/src/signature-utils.ts#L34)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `input` | BigNumber |
| `lengthInBytes` | number |

**Returns:** _Buffer_

### `Const` bufferToBigNumber

▸ **bufferToBigNumber**\(`input`: Buffer\): _BigNumber_

_Defined in_ [_signature-utils.ts:30_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm/src/signature-utils.ts#L30)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `input` | Buffer |

**Returns:** _BigNumber_

### getAddressFromPublicKey

▸ **getAddressFromPublicKey**\(`publicKey`: BigNumber\): _Address_

_Defined in_ [_signature-utils.ts:78_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm/src/signature-utils.ts#L78)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `publicKey` | BigNumber |

**Returns:** _Address_

### `Const` makeCanonical

▸ **makeCanonical**\(`S`: BigNumber\): _BigNumber_

_Defined in_ [_signature-utils.ts:21_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm/src/signature-utils.ts#L21)

If the signature is in the "bottom" of the curve, it is non-canonical Non-canonical signatures are illegal in Ethereum and therefore the S value must be transposed to the lower intersection [https://github.com/bitcoin/bips/blob/master/bip-0062.mediawiki\#Low\_S\_values\_in\_signatures](https://github.com/bitcoin/bips/blob/master/bip-0062.mediawiki#Low_S_values_in_signatures)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `S` | BigNumber |

**Returns:** _BigNumber_

### recoverKeyIndex

▸ **recoverKeyIndex**\(`signature`: Uint8Array, `publicKey`: BigNumber, `hash`: Uint8Array\): _number_

_Defined in_ [_signature-utils.ts:58_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/wallets/wallet-hsm/src/signature-utils.ts#L58)

Attempts each recovery key to find a match

**Parameters:**

| Name | Type |
| :--- | :--- |
| `signature` | Uint8Array |
| `publicKey` | BigNumber |
| `hash` | Uint8Array |

**Returns:** _number_

