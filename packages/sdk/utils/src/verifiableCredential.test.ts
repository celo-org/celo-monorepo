import {
  getPhoneNumberTypeJSONLD,
  getProofOptions,
  validateVerifiableCredential,
} from './verifiableCredential'

const MOCK_VALORA_ADDRESS = '0xa0ae58da58dfa46fa55c3b86545e7065f90ff011'
const MOCK_ATTESTATION_SIGNER_ADDRESS = '0xc0f4e7b1a61538447e08fad89f561a2d07f78a93'
const MOCK_PHONE_NUMBER_TYPE = 'MOBILE'
const MOCK_PHONE_NUMBER_TYPE_PROVIDER = 'twilio'
const MOCK_IDENTIFIER = ''

const MOCK_PHONE_NUMBER_TYPE_JSONLD = {
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    {
      phoneNumberType: 'https://docs.celo.org/phone_types',
      PhoneNumberType: 'https://docs.celo.org/PhoneNumberType',
    },
  ],
  type: ['VerifiableCredential', 'PhoneNumberType'],
  credentialSubject: {
    id: `did:pkh:eth:${MOCK_VALORA_ADDRESS}`,
    phoneNumberType: MOCK_PHONE_NUMBER_TYPE,
  },
  issuanceDate: '2021-06-16T12:04:33.563Z',
  issuer: `did:pkh:eth:${MOCK_ATTESTATION_SIGNER_ADDRESS}`,
}

const MOCK_PROOF_OPTIONS = JSON.stringify({
  verificationMethod: `did:pkh:eth:${MOCK_ATTESTATION_SIGNER_ADDRESS}#Recovery2020`,
  proofPurpose: 'assertionMethod',
})

const MOCK_VERIFIABLE_CREDENTIAL = JSON.stringify({
  '@context': [
    'https://www.w3.org/2018/credentials/v1',
    {
      PhoneNumberType: 'https://docs.celo.org/PhoneNumberType',
      phoneNumberType: 'https://docs.celo.org/phone_types',
    },
  ],
  type: ['VerifiableCredential', 'PhoneNumberType'],
  credentialSubject: {
    id: 'did:pkh:eth:0xa0ae58da58dfa46fa55c3b86545e7065f90ff011',
    phoneNumberType: 'mobile',
  },
  issuer: 'did:pkh:eth:0xc0f4e7b1a61538447e08fad89f561a2d07f78a93',
  issuanceDate: '2021-06-18T13:43:57.534Z',
  proof: {
    '@context': [
      {
        EthereumPersonalSignature2021: {
          '@context': {
            '@protected': true,
            '@version': 1.1,
            challenge: 'https://w3id.org/security#challenge',
            created: {
              '@id': 'http://purl.org/dc/terms/created',
              '@type': 'http://www.w3.org/2001/XMLSchema#dateTime',
            },
            domain: 'https://w3id.org/security#domain',
            expires: {
              '@id': 'https://w3id.org/security#expiration',
              '@type': 'http://www.w3.org/2001/XMLSchema#dateTime',
            },
            id: '@id',
            nonce: 'https://w3id.org/security#nonce',
            proofPurpose: {
              '@context': {
                '@protected': true,
                '@version': 1.1,
                assertionMethod: {
                  '@container': '@set',
                  '@id': 'https://w3id.org/security#assertionMethod',
                  '@type': '@id',
                },
                authentication: {
                  '@container': '@set',
                  '@id': 'https://w3id.org/security#authenticationMethod',
                  '@type': '@id',
                },
                id: '@id',
                type: '@type',
              },
              '@id': 'https://w3id.org/security#proofPurpose',
              '@type': '@vocab',
            },
            proofValue: 'https://w3id.org/security#proofValue',
            type: '@type',
            verificationMethod: {
              '@id': 'https://w3id.org/security#verificationMethod',
              '@type': '@id',
            },
          },
          '@id': 'https://demo.spruceid.com/ld/epsig/EthereumPersonalSignature2021',
        },
      },
    ],
    type: 'EthereumPersonalSignature2021',
    proofPurpose: 'assertionMethod',
    proofValue:
      '0x1f8cbfb1144e7f36e1656fa3086250f8f6189c5aae56f9c4c976ae43972880d471166d9fc747b1784792bb757f3753cd56d2dc8d15b59410d806c451c5846cae1b',
    verificationMethod: 'did:pkh:eth:0xc0f4e7b1a61538447e08fad89f561a2d07f78a93#Recovery2020',
    created: '2021-06-18T13:43:57.534Z',
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

describe('Verifiable Credential', () => {
  it('Should not throw errors', async () => {
    const result = await validateVerifiableCredential(MOCK_VERIFIABLE_CREDENTIAL)
    expect(result.errors.length).toEqual(0)
  })
})
