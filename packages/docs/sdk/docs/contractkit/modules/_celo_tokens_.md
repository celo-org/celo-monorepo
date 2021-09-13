[@celo/contractkit](../README.md) › ["celo-tokens"](_celo_tokens_.md)

# Module: "celo-tokens"

## Index

### Enumerations

* [StableToken](../enums/_celo_tokens_.stabletoken.md)
* [Token](../enums/_celo_tokens_.token.md)

### Classes

* [CeloTokens](../classes/_celo_tokens_.celotokens.md)

### Interfaces

* [CeloTokenInfo](../interfaces/_celo_tokens_.celotokeninfo.md)
* [StableTokenInfo](../interfaces/_celo_tokens_.stabletokeninfo.md)

### Type aliases

* [CeloTokenType](_celo_tokens_.md#celotokentype)
* [EachCeloToken](_celo_tokens_.md#eachcelotoken)

### Object literals

* [celoTokenInfos](_celo_tokens_.md#const-celotokeninfos)
* [stableTokenInfos](_celo_tokens_.md#const-stabletokeninfos)

## Type aliases

###  CeloTokenType

Ƭ **CeloTokenType**: *[StableToken](../enums/_celo_tokens_.stabletoken.md) | [Token](../enums/_celo_tokens_.token.md)*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:16](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L16)*

___

###  EachCeloToken

Ƭ **EachCeloToken**: *object*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:20](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L20)*

#### Type declaration:

## Object literals

### `Const` celoTokenInfos

### ▪ **celoTokenInfos**: *object*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:51](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L51)*

Basic info for each supported celo token, including stable tokens

▪ **[Token.CELO]**: *object*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:54](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L54)*

* **contract**: *[GoldToken](../enums/_base_.celocontract.md#goldtoken)* = CeloContract.GoldToken

* **symbol**: *[CELO](../enums/_celo_tokens_.token.md#celo)* = Token.CELO

___

### `Const` stableTokenInfos

### ▪ **stableTokenInfos**: *object*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:35](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L35)*

Basic info for each stable token

▪ **[StableToken.cEUR]**: *object*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:43](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L43)*

* **contract**: *[StableTokenEUR](../enums/_base_.celocontract.md#stabletokeneur)* = CeloContract.StableTokenEUR

* **exchangeContract**: *[ExchangeEUR](../enums/_base_.celocontract.md#exchangeeur)* = CeloContract.ExchangeEUR

* **symbol**: *[cEUR](../enums/_celo_tokens_.stabletoken.md#ceur)* = StableToken.cEUR

▪ **[StableToken.cUSD]**: *object*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:38](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L38)*

* **contract**: *[StableToken](../enums/_base_.celocontract.md#stabletoken)* = CeloContract.StableToken

* **exchangeContract**: *[Exchange](../enums/_base_.celocontract.md#exchange)* = CeloContract.Exchange

* **symbol**: *[cUSD](../enums/_celo_tokens_.stabletoken.md#cusd)* = StableToken.cUSD
