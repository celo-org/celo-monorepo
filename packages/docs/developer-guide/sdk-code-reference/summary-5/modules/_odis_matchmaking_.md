# odis/matchmaking

## Index

### Functions

* [getContactMatches](_odis_matchmaking_.md#getcontactmatches)
* [obfuscateNumberForMatchmaking](_odis_matchmaking_.md#obfuscatenumberformatchmaking)

## Functions

### getContactMatches

▸ **getContactMatches**\(`e164NumberCaller`: E164Number, `e164NumberContacts`: E164Number\[\], `account`: string, `phoneNumberIdentifier`: string, `signer`: [AuthSigner](_odis_query_.md#authsigner), `context`: [ServiceContext](), `dekSigner?`: [EncryptionKeySigner](), `clientVersion?`: undefined \| string, `sessionID?`: undefined \| string\): _Promise‹E164Number\[\]›_

_Defined in_ [_packages/sdk/identity/src/odis/matchmaking.ts:23_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/matchmaking.ts#L23)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `e164NumberCaller` | E164Number |
| `e164NumberContacts` | E164Number\[\] |
| `account` | string |
| `phoneNumberIdentifier` | string |
| `signer` | [AuthSigner](_odis_query_.md#authsigner) |
| `context` | [ServiceContext]() |
| `dekSigner?` | [EncryptionKeySigner]() |
| `clientVersion?` | undefined \| string |
| `sessionID?` | undefined \| string |

**Returns:** _Promise‹E164Number\[\]›_

### obfuscateNumberForMatchmaking

▸ **obfuscateNumberForMatchmaking**\(`e164Number`: string\): _string_

_Defined in_ [_packages/sdk/identity/src/odis/matchmaking.ts:87_](https://github.com/celo-org/celo-monorepo/blob/master/packages/sdk/identity/src/odis/matchmaking.ts#L87)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `e164Number` | string |

**Returns:** _string_

