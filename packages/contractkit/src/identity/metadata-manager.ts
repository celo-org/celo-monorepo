import { chain, Either, map } from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/pipeable'
import { chain as andThen, fromEither, TaskEither } from 'fp-ts/lib/TaskEither'
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
  ClaimNotFoundError,
  ClaimTypes,
  findClaim,
  IdentityMetadata,
  NameClaim,
  parseMetadata,
  serializeMetadata,
  SignedClaim,
  validateMetadata,
  ValidationError,
} from './types'

const now = () => Math.round(new Date().getTime() / 1000)

export type MetadataError = NetworkError | ValidationError

export class MetadataManager {
  readonly emptyIdentityMetadata: IdentityMetadata = Object.freeze({
    claims: [],
  })

  fetchMetadataTE = (url: string): TaskEither<MetadataError, IdentityMetadata> =>
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

  findAttestationServiceClaimE = (data: IdentityMetadata): Either<ClaimNotFoundError, string> => {
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
