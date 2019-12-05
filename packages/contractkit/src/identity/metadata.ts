import { AddressType, SignatureType } from '@celo/utils/lib/io'
import { Signer, verifySignature } from '@celo/utils/lib/signatureUtils'
import fetch from 'cross-fetch'
import { isLeft } from 'fp-ts/lib/Either'
import { readFileSync } from 'fs'
import * as t from 'io-ts'
import { PathReporter } from 'io-ts/lib/PathReporter'
import { Claim, ClaimPayload, ClaimType, hashOfClaims, isOfType } from './claims/claim'
import { ClaimTypes, SINGULAR_CLAIM_TYPES } from './claims/types'
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
      claims.length > 0 &&
      !verifySignature(hash, validatedData.right.meta.signature, validatedData.right.meta.address)
    ) {
      throw new Error('Signature could not be validated')
    }

    const res = new IdentityMetadataWrapper(validatedData.right)

    // Verify that singular claim types appear at most once
    SINGULAR_CLAIM_TYPES.forEach((claimType) => {
      const results = res.filterClaims(claimType)
      if (results.length > 1) {
        throw new Error(`Found ${results.length} claims of type ${claimType}, should be at most 1`)
      }
    })

    return res
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

    if (SINGULAR_CLAIM_TYPES.includes(claim.type)) {
      const index = this.data.claims.findIndex(isOfType(claim.type))
      if (index !== -1) {
        this.data.claims.splice(index, 1)
      }
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
