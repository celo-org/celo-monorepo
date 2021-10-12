import { completeIssueCredential, prepareIssueCredential, verifyCredential } from 'didkit-wasm-node'

/**
 * Returns a JSON-LD object to be used for Verifiable Credentials attesting PhoneNumberTypes
 * @param phoneNumberType The type of the phone number
 * @param phoneNumberTypeProvider The lookup provider of the phone number type
 * @param subject Subject of the verifiable credential, usually a Valora user
 * @param issuer Address of whom is issuing this credential, usually getAttestationSignerAddress()
 * @param identifier ODIS identifier for the phone number
 */
export const getPhoneNumberTypeJSONLD = (
  phoneNumberType: string,
  subject: string,
  issuer: string,
  identifier: string,
  phoneNumberTypeProvider: string
) => {
  return JSON.stringify({
    '@context': [
      'https://www.w3.org/2018/credentials/v1',
      {
        phoneNumberType: 'https://docs.celo.org/phone_types',
        phoneNumberTypeProvider: 'https://docs.celo.org/phone_type_providers',
        identifier: 'https://docs.celo.org/identifier',
        PhoneNumberType: 'https://docs.celo.org/PhoneNumberType',
      },
    ],
    type: ['VerifiableCredential', 'PhoneNumberType'],
    credentialSubject: {
      id: `did:pkh:celo:${subject.toLowerCase()}`,
      phoneNumberType,
      identifier,
      phoneNumberTypeProvider,
    },
    issuanceDate: new Date().toISOString(),
    issuer: `did:pkh:celo:${issuer.toLowerCase()}`,
  })
}

/**
 * Returns an object used to describe the proofOptions for DIDKit at EIP712 format
 * @param issuer Address of whom is issuing this credential, usually getAttestationSignerAddress()
 */
export const getProofOptions = (issuer: string) => {
  return JSON.stringify({
    verificationMethod: `did:pkh:celo:${issuer.toLowerCase()}#Recovery2020`,
    proofPurpose: 'assertionMethod',
    eip712Domain: {
      primaryType: 'VerifiableCredential',
      domain: {
        name: 'Celo Phone Number Type Verifiable Credential',
      },
      messageSchema: {
        EIP712Domain: [{ name: 'name', type: 'string' }],
        VerifiableCredential: [
          { name: '@context', type: 'string[]' },
          { name: 'type', type: 'string[]' },
          { name: 'issuer', type: 'string' },
          { name: 'issuanceDate', type: 'string' },
          { name: 'credentialSubject', type: 'CredentialSubject' },
          { name: 'proof', type: 'Proof' },
        ],
        CredentialSubject: [
          { name: 'id', type: 'string' },
          { name: 'phoneNumberType', type: 'string' },
          { name: 'identifier', type: 'string' },
          { name: 'phoneNumberTypeProvider', type: 'string' },
        ],
        Proof: [
          { name: '@context', type: 'string' },
          { name: 'verificationMethod', type: 'string' },
          { name: 'created', type: 'string' },
          { name: 'proofPurpose', type: 'string' },
          { name: 'type', type: 'string' },
        ],
      },
    },
  })
}

/**
 * Validates a Verifiable Credential, checking if there are errors or warnings
 * @throws Throws a new error with an array of errors identified in the Verifiable Credential
 * @param verifiableCredential The issued Verifiable Credential to be checked
 */
export const validateVerifiableCredential = async (verifiableCredential: string) => {
  const verifyOptionsString = '{}'
  const verifyResult = await verifyCredential(verifiableCredential, verifyOptionsString)
  const result = JSON.parse(verifyResult)

  // Check for errors
  if (result.errors.length > 0) {
    throw new Error(result.errors)
  }

  return result
}

/**
 * Issues a Verifiable Credential using DIDKit, https://www.w3.org/TR/vc-data-model/
 * @param credential JSON-LD object of the credential to be issued
 * @param proofOptions Proof options to be passed to DIDKit for issuance
 * @param signFunction Function responsible for signing the credential, usually contractKit.connection.sign
 * @param key Optional, key that will be used for the Verifiable Credential, just a placeholder when using a custom sign function
 * @returns Verifiable Credential
 */
export const issueCredential = async (
  credential: string,
  proofOptions: string,
  signFunction: (signInput: any) => string | Promise<string>,
  key: any = {
    kty: 'EC',
    crv: 'secp256k1',
    alg: 'ES256K-R',
    key_ops: ['signTypedData'],
  }
): Promise<string> => {
  const preparation = JSON.parse(
    await prepareIssueCredential(credential, proofOptions, JSON.stringify(key))
  )

  const signature = await signFunction(preparation.signingInput)

  const vc = await completeIssueCredential(credential, JSON.stringify(preparation), signature)

  try {
    await validateVerifiableCredential(vc)
  } catch (e) {
    throw e
  }

  return vc
}

export const VerifiableCredentialUtils = {
  issueCredential,
  validateVerifiableCredential,
  getProofOptions,
  getPhoneNumberTypeJSONLD,
}
