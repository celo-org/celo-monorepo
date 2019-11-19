import { AddressType, SignatureType } from '@celo/utils/lib/io'
import { parseSignature, Signer } from '@celo/utils/lib/signatureUtils'
import fetch from 'cross-fetch'
import { isLeft } from 'fp-ts/lib/Either'
import { readFileSync } from 'fs'
import * as t from 'io-ts'
import { PathReporter } from 'io-ts/lib/PathReporter'
import { Claim, ClaimPayload, ClaimType, hashOfClaims, isOfType } from './claims/claim'
import { ClaimTypes } from './claims/types'
export { ClaimTypes } from './claims/types'

const MetaType = t.type({
  address: AddressType,
  signature: SignatureType,
})

export const IdentityMetadataType = t.type({
  claims: t.array(ClaimType),
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
        signature: '',
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

    const validatedData = IdentityMetadataType.decode(data)

    if (isLeft(validatedData)) {
      // TODO: We could probably return a more useful error in the future
      throw new Error(PathReporter.report(validatedData).join(', '))
    }

    // Verify signature on the data
    const claims = validatedData.right.claims
    const hash = hashOfClaims(claims)
    if (
      !verifySignature(hash, validatedData.right.meta.signature, validatedData.right.meta.address)
    ) {
      throw new Error('Signature could not be validated')
    }
    return new IdentityMetadataWrapper(validatedData.right)
  }

  constructor(data: IdentityMetadata) {
    this.data = data
  }

  get claims() {
    return this.data.claims
  }

  hashOfClaims() {
    return hashOfClaims(this.data.claims)
  }

  toString() {
    return JSON.stringify({
      claims: this.data.claims,
      meta: this.data.meta,
    })
  }

  async addClaim(claim: Claim, signer: Signer) {
    switch (claim.type) {
      case ClaimTypes.ACCOUNT:
        if (claim.address === this.data.meta.address) {
          throw new Error("Can't claim self")
        }
        break

      default:
        break
    }
    this.data.claims.push(claim)
    this.data.meta.signature = await signer.sign(this.hashOfClaims())
  }

  findClaim<K extends ClaimTypes>(type: K): ClaimPayload<K> | undefined {
    return this.data.claims.find(isOfType(type))
  }

  filterClaims<K extends ClaimTypes>(type: K): Array<ClaimPayload<K>> {
    return this.data.claims.filter(isOfType(type))
  }
}

export function verifySignature(message: string, signature: string, signer: string) {
  try {
    parseSignature(message, signature, signer)
    return true
  } catch (error) {
    return false
  }
}
