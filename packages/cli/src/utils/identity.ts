import { ContractKit } from '@celo/contractkit'
import { ClaimTypes, IdentityMetadataWrapper } from '@celo/contractkit/lib/identity'
import { Claim, validateClaim, verifyClaim } from '@celo/contractkit/lib/identity/claims/claim'
import {
  VALIDATABLE_CLAIM_TYPES,
  VERIFIABLE_CLAIM_TYPES,
} from '@celo/contractkit/lib/identity/claims/types'
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

  protected get signer() {
    const res = this.parse(this.self)
    const address = toChecksumAddress(res.flags.from)
    return NativeSigner(this.kit.web3.eth.sign, address)
  }

  protected async addClaim(metadata: IdentityMetadataWrapper, claim: Claim) {
    try {
      cli.action.start(`Add claim`)
      await metadata.addClaim(claim, this.signer)
      cli.action.stop()
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

export const displayMetadata = async (metadata: IdentityMetadataWrapper, kit: ContractKit) => {
  const metadataURLGetter = async (address: string) => {
    const accounts = await kit.contracts.getAccounts()
    return accounts.getMetadataURL(address)
  }

  const data = await concurrentMap(5, metadata.claims, async (claim) => {
    const verifiable = VERIFIABLE_CLAIM_TYPES.includes(claim.type)
    const validatable = VALIDATABLE_CLAIM_TYPES.includes(claim.type)
    const status = verifiable
      ? await verifyClaim(claim, metadata.data.meta.address, metadataURLGetter)
      : validatable
        ? await validateClaim(claim, metadata.data.meta.address, kit)
        : 'N/A'
    let extra = ''
    switch (claim.type) {
      case ClaimTypes.ATTESTATION_SERVICE_URL:
        extra = `URL: ${claim.url}`
        break
      case ClaimTypes.DOMAIN:
        extra = `Domain: ${claim.domain}`
        break
      case ClaimTypes.KEYBASE:
        extra = `Username: ${claim.username}`
        break
      case ClaimTypes.NAME:
        extra = `Name: "${claim.name}"`
        break
      default:
        extra = JSON.stringify(claim)
        break
    }
    return {
      type: claim.type,
      extra,
      status: verifiable
        ? status
          ? `Could not verify: ${status}`
          : 'Verified!'
        : validatable
          ? status
            ? `Invalid: ${status}`
            : `Valid!`
          : 'N/A',
      createdAt: moment.unix(claim.timestamp).fromNow(),
    }
  })

  cli.table(
    data,
    {
      type: { header: 'Type' },
      extra: { header: 'Value' },
      status: { header: 'Status' },
      createdAt: { header: 'Created At' },
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
