# Module: "packages/sdk/utils/src/verifiableCredential"

## Index

### Functions

* [getPhoneNumberTypeJSONLD](_packages_sdk_utils_src_verifiablecredential_.md#const-getphonenumbertypejsonld)
* [getProofOptions](_packages_sdk_utils_src_verifiablecredential_.md#const-getproofoptions)
* [issueCredential](_packages_sdk_utils_src_verifiablecredential_.md#const-issuecredential)
* [validateVerifiableCredential](_packages_sdk_utils_src_verifiablecredential_.md#const-validateverifiablecredential)

### Object literals

* [VerifiableCredentialUtils](_packages_sdk_utils_src_verifiablecredential_.md#const-verifiablecredentialutils)

## Functions

### `Const` getPhoneNumberTypeJSONLD

▸ **getPhoneNumberTypeJSONLD**(`phoneNumberType`: string, `subject`: string, `issuer`: string): *string*

Defined in packages/sdk/utils/src/verifiableCredential.ts:9

Returns a JSON-LD object to be used for Verifiable Credentials attesting PhoneNumberTypes

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`phoneNumberType` | string | The type of the phone number |
`subject` | string | Subject of the verifiable credential, usually a Valora user |
`issuer` | string | Address of whom is issuing this credential, usually getAttestationSignerAddress()  |

**Returns:** *string*

___

### `Const` getProofOptions

▸ **getProofOptions**(`issuer`: string): *string*

Defined in packages/sdk/utils/src/verifiableCredential.ts:36

Returns an object used to describe the proofOptions for DIDKit

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`issuer` | string | Address of whom is issuing this credential, usually getAttestationSignerAddress()  |

**Returns:** *string*

___

### `Const` issueCredential

▸ **issueCredential**(`credential`: string, `proofOptions`: string, `signFunction`: function, `key`: any): *Promise‹string›*

Defined in packages/sdk/utils/src/verifiableCredential.ts:67

Issues a Verifiable Credential using DIDKit, https://www.w3.org/TR/vc-data-model/

**Parameters:**

▪ **credential**: *string*

JSON-LD object of the credential to be issued

▪ **proofOptions**: *string*

Proof options to be passed to DIDKit for issuance

▪ **signFunction**: *function*

Function responsible for signing the credential, usually contractKit.connection.sign

▸ (`signInput`: any): *string | Promise‹string›*

**Parameters:**

Name | Type |
------ | ------ |
`signInput` | any |

▪`Default value`  **key**: *any*= {
    kty: 'EC',
    crv: 'secp256k1',
    alg: 'ES256K-R',
    key_ops: ['signPersonalMessage'],
  }

Optional, key that will be used for the Verifiable Credential, just a placeholder when using a custom sign function

**Returns:** *Promise‹string›*

Verifiable Credential

___

### `Const` validateVerifiableCredential

▸ **validateVerifiableCredential**(`verifiableCredential`: string): *Promise‹void›*

Defined in packages/sdk/utils/src/verifiableCredential.ts:48

Validates a Verifiable Credential, checking if there are errors or warnings

**`throws`** Throws a new error with an array of errors identified in the Verifiable Credential

**Parameters:**

Name | Type | Description |
------ | ------ | ------ |
`verifiableCredential` | string | The issued Verifiable Credential to be checked  |

**Returns:** *Promise‹void›*

## Object literals

### `Const` VerifiableCredentialUtils

### ▪ **VerifiableCredentialUtils**: *object*

Defined in packages/sdk/utils/src/verifiableCredential.ts:91

###  getPhoneNumberTypeJSONLD

• **getPhoneNumberTypeJSONLD**: *getPhoneNumberTypeJSONLD*

Defined in packages/sdk/utils/src/verifiableCredential.ts:95

###  getProofOptions

• **getProofOptions**: *getProofOptions*

Defined in packages/sdk/utils/src/verifiableCredential.ts:94

###  issueCredential

• **issueCredential**: *issueCredential*

Defined in packages/sdk/utils/src/verifiableCredential.ts:92

###  validateVerifiableCredential

• **validateVerifiableCredential**: *validateVerifiableCredential*

Defined in packages/sdk/utils/src/verifiableCredential.ts:93
