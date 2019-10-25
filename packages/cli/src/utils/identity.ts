import {
  ClaimTypes,
  IdentityMetadata,
  IdentityMetadataWrapper,
} from '@celo/contractkit/lib/identity'
import { writeFileSync } from 'fs'
import moment from 'moment'

export const displayMetadata = (metadata: IdentityMetadata) => {
  metadata.claims.forEach((claim) => {
    switch (claim.payload.type) {
      case ClaimTypes.ATTESTATION_SERVICE_URL:
        console.info(`Attestation Service Claim`)
        console.info(`URL: ${claim.payload.url}`)
        break
      case ClaimTypes.NAME:
        console.info(`Name Claim`)
        console.info(`Name: "${claim.payload.name}"`)
        break
      case ClaimTypes.DOMAIN:
        console.info('Domain Claim')
        console.info(`Domain: ${claim.payload.domain}`)
        break
      default:
        console.info(`Unknown Claim`)
        console.info(JSON.stringify(claim.payload))
        break
    }

    console.info(`(claim created ${moment.unix(claim.payload.timestamp).fromNow()})\n`)
  })
}

export const modifyMetadata = (
  filePath: string,
  operation: (metadata: IdentityMetadataWrapper) => void
) => {
  const metadata = IdentityMetadataWrapper.fromFile(filePath)
  operation(metadata)
  writeFileSync(filePath, metadata.toString())
}
