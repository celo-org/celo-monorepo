import { chain, map } from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/pipeable'
import { chain as andThen, fromEither } from 'fp-ts/lib/TaskEither'
import { SignedClaim } from '../claims'
import {
  asClassicPromise,
  asThrowable,
  fetchAsTaskEither,
  NetworkError,
  writeToFileSystem,
} from '../utils/fp-ts'
import {
  AttestationServiceURLClaim,
  Claim,
  ClaimTypes,
  findClaim,
  IdentityMetadata,
  NameClaim,
  parseMetadata,
  serializeMetadata,
  validateMetadata,
  ValidationError,
} from './types'

const now = () => Math.round(new Date().getTime() / 1000)

export type MetadataError = NetworkError | ValidationError

export class MetadataManager {
  testnet: string | undefined

  emptyIdentityMetadata: IdentityMetadata = {
    claims: [],
  }

  constructor(testnet?: string) {
    this.testnet = testnet
  }

  fetchMetadataTE = (url: string) =>
    pipe(
      fetchAsTaskEither(url),
      andThen((body) =>
        pipe(
          body,
          parseMetadata,
          chain(validateMetadata),
          fromEither
        )
      )
    )

  findAttestationServiceClaimE = (data: IdentityMetadata) => {
    return pipe(
      data,
      findClaim(ClaimTypes.ATTESTATION_SERVICE_URL),
      // @ts-ignore Typescript can't infer that the claim must be an Attestation service claim
      map((claim: AttestationServiceURLClaim) => claim.url)
    )
  }

  createAttestationServiceURLClaim = (url: string): AttestationServiceURLClaim => ({
    type: ClaimTypes.ATTESTATION_SERVICE_URL,
    url,
    timestamp: now(),
  })

  createNameClaim = (name: string): NameClaim => ({
    type: ClaimTypes.NAME,
    name,
    timestamp: now(),
  })

  saveMetadataToDisk = (path: string) => (data: IdentityMetadata) =>
    writeToFileSystem(path)(serializeMetadata(data))

  addClaim(claim: Claim) {
    return (data: IdentityMetadata) => ({
      claims: [...data.claims, this.signClaim(claim)],
    })
  }

  fetchMetadata = asClassicPromise(this.fetchMetadataTE)
  findAttestationServiceClaim = asThrowable(this.findAttestationServiceClaimE)

  private signClaim = (claim: Claim): SignedClaim => ({
    payload: claim,
    // TODO: Actually sign the claim
    signature: '',
  })
}
