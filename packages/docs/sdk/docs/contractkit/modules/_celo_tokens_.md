[@celo/contractkit](../README.md) › [Globals](../globals.md) › ["celo-tokens"](_celo_tokens_.md)

# Module: "celo-tokens"

## Index

### References

* [CeloTokenType](_celo_tokens_.md#celotokentype)
* [StableToken](_celo_tokens_.md#stabletoken)
* [Token](_celo_tokens_.md#token)

### Classes

* [CeloTokens](../classes/_celo_tokens_.celotokens.md)

### Interfaces

* [CeloTokenInfo](../interfaces/_celo_tokens_.celotokeninfo.md)
* [StableTokenInfo](../interfaces/_celo_tokens_.stabletokeninfo.md)

### Type aliases

* [CeloTokenWrapper](_celo_tokens_.md#celotokenwrapper)
* [EachCeloToken](_celo_tokens_.md#eachcelotoken)

### Functions

* [isStableTokenContract](_celo_tokens_.md#isstabletokencontract)

### Object literals

* [celoTokenInfos](_celo_tokens_.md#const-celotokeninfos)
* [stableTokenInfos](_celo_tokens_.md#const-stabletokeninfos)

## References

###  CeloTokenType

• **CeloTokenType**:

___

###  StableToken

• **StableToken**:

___

###  Token

• **Token**:

## Type aliases

###  CeloTokenWrapper

Ƭ **CeloTokenWrapper**: *[GoldTokenWrapper](../classes/_wrappers_goldtokenwrapper_.goldtokenwrapper.md) | [StableTokenWrapper](../classes/_wrappers_stabletokenwrapper_.stabletokenwrapper.md)*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:14](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L14)*

___

###  EachCeloToken

Ƭ **EachCeloToken**: *object*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:10](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L10)*

#### Type declaration:

## Functions

###  isStableTokenContract

▸ **isStableTokenContract**(`contract`: [CeloContract](../enums/_base_.celocontract.md)): *boolean*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:275](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L275)*

**Parameters:**

Name | Type |
------ | ------ |
`contract` | [CeloContract](../enums/_base_.celocontract.md) |

**Returns:** *boolean*

## Object literals

### `Const` celoTokenInfos

### ▪ **celoTokenInfos**: *object*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:48](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L48)*

Basic info for each supported celo token, including stable tokens

▪ **[Token.CELO]**: *object*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:51](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L51)*

* **contract**: *[GoldToken](../enums/_base_.celocontract.md#goldtoken)* = CeloContract.GoldToken

* **symbol**: *CELO* = Token.CELO

___

### `Const` stableTokenInfos

### ▪ **stableTokenInfos**: *object*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:27](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L27)*

Basic info for each stable token

▪ **[StableToken.cEUR]**: *object*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L35)*

* **contract**: *[StableTokenEUR](../enums/_base_.celocontract.md#stabletokeneur)* = CeloContract.StableTokenEUR

* **exchangeContract**: *[ExchangeEUR](../enums/_base_.celocontract.md#exchangeeur)* = CeloContract.ExchangeEUR

* **symbol**: *cEUR* = StableToken.cEUR

▪ **[StableToken.cREAL]**: *object*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:40](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L40)*

* **contract**: *[StableTokenBRL](../enums/_base_.celocontract.md#stabletokenbrl)* = CeloContract.StableTokenBRL

* **exchangeContract**: *[ExchangeBRL](../enums/_base_.celocontract.md#exchangebrl)* = CeloContract.ExchangeBRL

* **symbol**: *cREAL* = StableToken.cREAL

▪ **[StableToken.cUSD]**: *object*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:30](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L30)*

* **contract**: *[StableToken](../enums/_base_.celocontract.md#stabletoken)* = CeloContract.StableToken

* **exchangeContract**: *[Exchange](../enums/_base_.celocontract.md#exchange)* = CeloContract.Exchange

* **symbol**: *cUSD* = StableToken.cUSD
