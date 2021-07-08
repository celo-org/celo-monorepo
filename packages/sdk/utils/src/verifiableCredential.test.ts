import { getPhoneNumberTypeJSONLD, getProofOptions } from './verifiableCredential'

const MOCK_VALORA_ADDRESS = '0xa0ae58da58dfa46fa55c3b86545e7065f90ff011'
const MOCK_ATTESTATION_SIGNER_ADDRESS = '0xc0f4e7b1a61538447e08fad89f561a2d07f78a93'
const MOCK_PHONE_NUMBER_TYPE = 'MOBILE'
const MOCK_PHONE_NUMBER_TYPE_PROVIDER = 'twilio'
const MOCK_IDENTIFIER = ''

const MOCK_PHONE_NUMBER_TYPE_JSONLD = {
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    {
      PhoneNumberType: 'https://docs.celo.org/PhoneNumberType',
      identifier: 'https://docs.celo.org/identifier',
      phoneNumberType: 'https://docs.celo.org/phone_types',
      phoneNumberTypeProvider: 'https://docs.celo.org/phone_type_providers',
    },
  ],
  type: ['VerifiableCredential', 'PhoneNumberType'],
  credentialSubject: {
    id: `did:pkh:celo:${MOCK_VALORA_ADDRESS}`,
    phoneNumberType: MOCK_PHONE_NUMBER_TYPE,
    phoneNumberTypeProvider: MOCK_PHONE_NUMBER_TYPE_PROVIDER,
    identifier: MOCK_IDENTIFIER,
  },
  issuanceDate: '2021-06-16T12:04:33.563Z',
  issuer: `did:pkh:celo:${MOCK_ATTESTATION_SIGNER_ADDRESS}`,
}

const MOCK_PROOF_OPTIONS = JSON.stringify({
  verificationMethod: `did:pkh:celo:${MOCK_ATTESTATION_SIGNER_ADDRESS}#Recovery2020`,
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

describe('JSON-LD Objects', () => {
  it('Should return the correct PhoneNumberType JSON-LD object', () => {
    const phoneNumberTypeJSONLD = JSON.parse(
      getPhoneNumberTypeJSONLD(
        MOCK_PHONE_NUMBER_TYPE,
        MOCK_VALORA_ADDRESS,
        MOCK_ATTESTATION_SIGNER_ADDRESS,
        MOCK_IDENTIFIER,
        MOCK_PHONE_NUMBER_TYPE_PROVIDER
      )
    )

    // Required for testing since the function always get a new time at creation
    phoneNumberTypeJSONLD.issuanceDate = '2021-06-16T12:04:33.563Z'

    expect(phoneNumberTypeJSONLD).toEqual(MOCK_PHONE_NUMBER_TYPE_JSONLD)
  })
})

describe('Proof Options', () => {
  it('Should return the correct proofOptions object for DIDKit', () => {
    const proofOptions = getProofOptions(MOCK_ATTESTATION_SIGNER_ADDRESS)
    expect(proofOptions).toEqual(MOCK_PROOF_OPTIONS)
  })
})
