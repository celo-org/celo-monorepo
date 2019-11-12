import { ClaimTypes, IdentityMetadataWrapper } from '@celo/contractkit/lib/identity'
import { Claim, hashOfClaim, verifyClaim } from '@celo/contractkit/lib/identity/claims/claim'
import { VERIFIABLE_CLAIM_TYPES } from '@celo/contractkit/lib/identity/claims/types'
import { concurrentMap } from '@celo/utils/lib/async'
import { NativeSigner } from '@celo/utils/lib/signatureUtils'
import { cli } from 'cli-ux'
import { toChecksumAddress } from 'ethereumjs-util'
import { writeFileSync } from 'fs'
import moment from 'moment'
import { BaseCommand } from '../base'
import { Args, Flags } from './command'

export abstract class ClaimCommand extends BaseCommand {
  static flags = {
    ...BaseCommand.flags,
    from: Flags.address({
      required: true,
      description: 'Addess of the account to set metadata for',
    }),
  }
  static args = [Args.file('file', { description: 'Path of the metadata file' })]
  public requireSynced: boolean = false
  // We need this to properly parse flags for subclasses
  protected self = ClaimCommand

  protected readMetadata = () => {
    const { args } = this.parse(this.self)
    const filePath = args.file
    try {
      cli.action.start(`Read Metadata from ${filePath}`)
      const data = IdentityMetadataWrapper.fromFile(filePath)
      cli.action.stop()
      return data
    } catch (error) {
      cli.action.stop(`Error: ${error}`)
      throw error
    }
  }

  protected async addClaim(metadata: IdentityMetadataWrapper, claim: Claim) {
    try {
      cli.action.start(`Add claim`)
      const res = this.parse(this.self)
      const address = toChecksumAddress(res.flags.from)
      const signedClaim = await metadata.addClaim(
        claim,
        NativeSigner(this.kit.web3.eth.sign, address)
      )
      cli.action.stop()
      return signedClaim
    } catch (error) {
      cli.action.stop(`Error: ${error}`)
      throw error
    }
  }

  protected writeMetadata = (metadata: IdentityMetadataWrapper) => {
    const { args } = this.parse(this.self)
    const filePath = args.file

    try {
      cli.action.start(`Write Metadata to ${filePath}`)
      writeFileSync(filePath, metadata.toString())
      cli.action.stop()
    } catch (error) {
      cli.action.stop(`Error: ${error}`)
      throw error
    }
  }
}

export const claimFlags = {
  from: Flags.address({
    required: true,
    description: 'Addess of the account to set metadata for',
  }),
}

export const claimArgs = [Args.file('file', { description: 'Path of the metadata file' })]

export const displayMetadata = async (metadata: IdentityMetadataWrapper) => {
  const data = await concurrentMap(5, metadata.claims, async (claim) => {
    const verifiable = VERIFIABLE_CLAIM_TYPES.includes(claim.payload.type)
    const status = await verifyClaim(claim, metadata.data.meta.address)
    let extra = ''
    switch (claim.payload.type) {
      case ClaimTypes.ATTESTATION_SERVICE_URL:
        extra = `URL: ${claim.payload.url}`
        break
      case ClaimTypes.DOMAIN:
        extra = `Domain: ${claim.payload.domain}`
        break
      case ClaimTypes.KEYBASE:
        extra = `Username: ${claim.payload.username}`
        break
      case ClaimTypes.NAME:
        extra = `Name: "${claim.payload.name}"`
        break
      default:
        extra = JSON.stringify(claim.payload)
        break
    }
    return {
      type: claim.payload.type,
      extra,
      verifiable: verifiable ? 'Yes' : 'No',
      status: verifiable ? (status ? `Invalid: ${status}` : 'Valid!') : '',
      createdAt: moment.unix(claim.payload.timestamp).fromNow(),
      hash: hashOfClaim(claim.payload),
    }
  })

  cli.table(
    data,
    {
      type: { header: 'Type' },
      extra: { header: 'Value' },
      verifiable: { header: 'Verifiable' },
      status: { header: 'Status' },
      createdAt: { header: 'Created At' },
      hash: { header: 'Hash' },
    },
    {}
  )
}

export const modifyMetadata = async (
  filePath: string,
  operation: (metadata: IdentityMetadataWrapper) => Promise<void>
) => {
  const metadata = IdentityMetadataWrapper.fromFile(filePath)
  await operation(metadata)
  writeFileSync(filePath, metadata.toString())
}
