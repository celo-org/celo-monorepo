import { ACCOUNT_ADDRESSES } from '@celo/dev-utils/lib/ganache-setup'
import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import { NativeSigner } from '@celo/utils/lib/signatureUtils'
import { newKitFromWeb3 } from '../kit'
import { createNameClaim } from './claims/claim'
import { ClaimTypes, IdentityMetadataWrapper } from './metadata'

testWithGanache('Metadata', (web3) => {
  const kit = newKitFromWeb3(web3)
  const address = ACCOUNT_ADDRESSES[0]
  const otherAddress = ACCOUNT_ADDRESSES[1]

  test('correctly recovers the claims', async () => {
    const name = 'Celo'
    const metadata = IdentityMetadataWrapper.fromEmpty(address)
    await metadata.addClaim(createNameClaim(name), NativeSigner(kit.web3.eth.sign, address))
    const serializedMetadata = metadata.toString()
    const parsedMetadata = IdentityMetadataWrapper.fromRawString(serializedMetadata)
    const nameClaim = parsedMetadata.findClaim(ClaimTypes.NAME)

    expect(nameClaim).not.toBeUndefined()
    expect(nameClaim!.name).toEqual(name)
  })

  test('should reject metadata that contains a signature by a different account', async () => {
    const name = 'Celo'
    const metadata = IdentityMetadataWrapper.fromEmpty(address)
    await metadata.addClaim(createNameClaim(name), NativeSigner(kit.web3.eth.sign, otherAddress))
    const serializedMetadata = metadata.toString()
    expect(() => {
      IdentityMetadataWrapper.fromRawString(serializedMetadata)
    }).toThrow()
  })
})
