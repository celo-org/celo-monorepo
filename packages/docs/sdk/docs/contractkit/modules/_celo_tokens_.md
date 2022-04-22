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

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:17](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L17)*

___

###  EachCeloToken

Ƭ **EachCeloToken**: *object*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:21](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L21)*

#### Type declaration:

## Object literals

### `Const` celoTokenInfos

### ▪ **celoTokenInfos**: *object*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:57](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L57)*

Basic info for each supported celo token, including stable tokens

▪ **[Token.CELO]**: *object*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:60](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L60)*

* **contract**: *[GoldToken](../enums/_base_.celocontract.md#goldtoken)* = CeloContract.GoldToken

* **symbol**: *[CELO](../enums/_celo_tokens_.token.md#celo)* = Token.CELO

___

### `Const` stableTokenInfos

### ▪ **stableTokenInfos**: *object*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:36](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L36)*

Basic info for each stable token

▪ **[StableToken.cEUR]**: *object*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:44](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L44)*

* **contract**: *[StableTokenEUR](../enums/_base_.celocontract.md#stabletokeneur)* = CeloContract.StableTokenEUR

* **exchangeContract**: *[ExchangeEUR](../enums/_base_.celocontract.md#exchangeeur)* = CeloContract.ExchangeEUR

* **symbol**: *[cEUR](../enums/_celo_tokens_.stabletoken.md#ceur)* = StableToken.cEUR

▪ **[StableToken.cREAL]**: *object*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:49](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L49)*

* **contract**: *[StableTokenBRL](../enums/_base_.celocontract.md#stabletokenbrl)* = CeloContract.StableTokenBRL

* **exchangeContract**: *[ExchangeBRL](../enums/_base_.celocontract.md#exchangebrl)* = CeloContract.ExchangeBRL

* **symbol**: *[cREAL](../enums/_celo_tokens_.stabletoken.md#creal)* = StableToken.cREAL

▪ **[StableToken.cUSD]**: *object*

*Defined in [packages/sdk/contractkit/src/celo-tokens.ts:39](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/contractkit/src/celo-tokens.ts#L39)*

* **contract**: *[StableToken](../enums/_base_.celocontract.md#stabletoken)* = CeloContract.StableToken

* **exchangeContract**: *[Exchange](../enums/_base_.celocontract.md#exchange)* = CeloContract.Exchange

* **symbol**: *[cUSD](../enums/_celo_tokens_.stabletoken.md#cusd)* = StableToken.cUSD
