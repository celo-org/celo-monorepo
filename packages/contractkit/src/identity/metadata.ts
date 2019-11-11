import { Signer } from '@celo/utils/lib/signatureUtils'
import fetch from 'cross-fetch'
import { isLeft } from 'fp-ts/lib/Either'
import { readFileSync } from 'fs'
import * as t from 'io-ts'
import { PathReporter } from 'io-ts/lib/PathReporter'
import {
  Claim,
  ClaimPayload,
  hashOfClaim,
  isOfType,
  serializeClaim,
  SerializedSignedClaimType,
  SignedClaim,
  SignedClaimType,
  verifySignature,
} from './claims/claim'
import { AddressType, ClaimTypes } from './claims/types'
export { ClaimTypes } from './claims/types'

const MetaType = t.type({
  address: AddressType,
})

export const IdentityMetadataType = t.type({
  claims: t.array(SignedClaimType),
  meta: MetaType,
})
export type IdentityMetadata = t.TypeOf<typeof IdentityMetadataType>

export class IdentityMetadataWrapper {
  data: IdentityMetadata

  static fromEmpty(address: string) {
    return new IdentityMetadataWrapper({
      claims: [],
      meta: {
        address,
      },
    })
  }

  static async fetchFromURL(url: string) {
    const resp = await fetch(url)
    if (!resp.ok) {
      throw new Error(`Request failed with status ${resp.status}`)
    }
    return this.fromRawString(await resp.text())
  }

  static fromFile(path: string) {
    return this.fromRawString(readFileSync(path, 'utf-8'))
  }

  static fromRawString(rawData: string) {
    const data = JSON.parse(rawData)

    const validatedMeta = MetaType.decode(data.meta)
    if (isLeft(validatedMeta)) {
      throw new Error('Meta payload is invalid: ' + PathReporter.report(validatedMeta).join(', '))
    }

    const address = validatedMeta.right.address

    const verifySignatureAndParse = (claim: any) => {
      const parsedClaim = SerializedSignedClaimType.decode(claim)
      if (isLeft(parsedClaim)) {
        throw new Error(`Serialized claim is not of the right format: ${claim}`)
      }
      if (!verifySignature(parsedClaim.right.payload, parsedClaim.right.signature, address)) {
        throw new Error(`Could not verify signature of the claim: ${claim.payload}`)
      }
      return {
        payload: JSON.parse(parsedClaim.right.payload),
        signature: parsedClaim.right.signature,
      }
    }

    // TODO: Validate that data.claims is an array
    const parsedData = {
      claims: data.claims.map(verifySignatureAndParse),
      meta: validatedMeta.right,
    }

    // Here we are mostly validating the shape of the claims
    const validatedData = IdentityMetadataType.decode(parsedData)

    if (isLeft(validatedData)) {
      // TODO: We could probably return a more useful error in the future
      throw new Error(PathReporter.report(validatedData).join(', '))
    }

    return new IdentityMetadataWrapper(validatedData.right)
  }

  constructor(data: IdentityMetadata) {
    this.data = data
  }

  get claims() {
    return this.data.claims
  }

  toString() {
    return JSON.stringify({
      claims: this.data.claims.map((claim) => ({
        payload: serializeClaim(claim.payload),
        signature: claim.signature,
      })),
      meta: this.data.meta,
    })
  }

  async addClaim(claim: Claim, signer: Signer) {
    const signedClaim = await this.signClaim(claim, signer)
    this.data.claims.push(signedClaim)
    return signedClaim
  }

  findClaim<K extends ClaimTypes>(type: K): ClaimPayload<K> | undefined {
    return this.data.claims.map((x) => x.payload).find(isOfType(type))
  }

  private signClaim = async (claim: Claim, signer: Signer): Promise<SignedClaim> => {
    const messageHash = hashOfClaim(claim)
    const signature = await signer.sign(messageHash)
    return {
      payload: claim,
      signature,
    }
  }
}
