import { eqAddress } from '@celo/utils/lib/address'
import { AddressType, SignatureType } from '@celo/utils/lib/io'
import { guessSigner, Signer, verifySignature } from '@celo/utils/lib/signatureUtils'
import fetch from 'cross-fetch'
import { isLeft } from 'fp-ts/lib/Either'
import { readFileSync } from 'fs'
import * as t from 'io-ts'
import { PathReporter } from 'io-ts/lib/PathReporter'
import { ContractKit } from '../kit'
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

  static async fetchFromURL(kit: ContractKit, url: string) {
    const resp = await fetch(url)
    if (!resp.ok) {
      throw new Error(`Request failed with status ${resp.status}`)
    }
    return this.fromRawString(kit, await resp.text())
  }

  static fromFile(kit: ContractKit, path: string) {
    return this.fromRawString(kit, readFileSync(path, 'utf-8'))
  }

  static async verifySigner(kit: ContractKit, hash: any, signature: any, metadata: any) {
    return this.verifySignerForAddress(kit, hash, signature, metadata.address)
  }

  static async verifySignerForAddress(
    kit: ContractKit,
    hash: any,
    signature: any,
    address: string
  ) {
    // First try to verify on account's address
    if (!verifySignature(hash, signature, address)) {
      // If this fails, signature may still be one of `address`' signers
      const accounts = await kit.contracts.getAccounts()
      if (await accounts.isAccount(address)) {
        const signers = await Promise.all([
          accounts.getVoteSigner(address),
          accounts.getValidatorSigner(address),
          accounts.getAttestationSigner(address),
        ])
        return signers.some((signer) => verifySignature(hash, signature, signer))
      }
      return false
    }
    return true
  }

  static async fromRawString(kit: ContractKit, rawData: string) {
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
      !(await this.verifySigner(
        kit,
        hash,
        validatedData.right.meta.signature,
        validatedData.right.meta
      ))
    ) {
      throw new Error(
        `Signature could not be validated. Guessing signer: ${guessSigner(
          hash,
          validatedData.right.meta.signature
        )}`
      )
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
        if (eqAddress(claim.address, this.data.meta.address)) {
          throw new Error("Can't claim self")
        }
        break
      case ClaimTypes.DOMAIN: {
        const existingClaims = this.data.claims.filter((el: any) => el.domain === claim.domain)
        if (existingClaims.length > 0) {
          return existingClaims[0]
        }
        break
      }
      case ClaimTypes.KEYBASE: {
        const existingClaims = this.data.claims.filter((el: any) => el.username === claim.username)
        if (existingClaims.length > 0) {
          return existingClaims[0]
        }
      }
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
    return claim
  }

  findClaim<K extends ClaimTypes>(type: K): ClaimPayload<K> | undefined {
    return this.data.claims.find(isOfType(type))
  }

  filterClaims<K extends ClaimTypes>(type: K): Array<ClaimPayload<K>> {
    return this.data.claims.filter(isOfType(type))
  }
}
