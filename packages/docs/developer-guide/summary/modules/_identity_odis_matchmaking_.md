# identity/odis/matchmaking

## Index

### Functions

* [getContactMatches](_identity_odis_matchmaking_.md#getcontactmatches)
* [obfuscateNumberForMatchmaking](_identity_odis_matchmaking_.md#obfuscatenumberformatchmaking)

## Functions

### getContactMatches

▸ **getContactMatches**\(`e164NumberCaller`: E164Number, `e164NumberContacts`: E164Number\[\], `account`: string, `phoneNumberIdentifier`: string, `signer`: [AuthSigner](_identity_odis_query_.md#authsigner), `context`: [ServiceContext](), `clientVersion?`: undefined \| string\): _Promise‹E164Number\[\]›_

_Defined in_ [_packages/contractkit/src/identity/odis/matchmaking.ts:20_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/odis/matchmaking.ts#L20)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `e164NumberCaller` | E164Number |
| `e164NumberContacts` | E164Number\[\] |
| `account` | string |
| `phoneNumberIdentifier` | string |
| `signer` | [AuthSigner](_identity_odis_query_.md#authsigner) |
| `context` | [ServiceContext]() |
| `clientVersion?` | undefined \| string |

**Returns:** _Promise‹E164Number\[\]›_

### obfuscateNumberForMatchmaking

▸ **obfuscateNumberForMatchmaking**\(`e164Number`: string\): _string_

_Defined in_ [_packages/contractkit/src/identity/odis/matchmaking.ts:68_](https://github.com/celo-org/celo-monorepo/blob/master/packages/contractkit/src/identity/odis/matchmaking.ts#L68)

**Parameters:**

| Name | Type |
| :--- | :--- |
| `e164Number` | string |

**Returns:** _string_

