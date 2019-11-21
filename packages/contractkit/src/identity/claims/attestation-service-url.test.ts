import { ACCOUNT_ADDRESSES } from '@celo/dev-utils/lib/ganache-setup'
import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import { NativeSigner } from '@celo/utils/lib/signatureUtils'
import { newKitFromWeb3 } from '../../kit'
import { IdentityMetadataWrapper } from '../metadata'
import { createAttestationServiceURLClaim } from './attestation-service-url'

testWithGanache('AttestationServiceURL claims', (web3) => {
  const kit = newKitFromWeb3(web3)
  const url = 'https://example.com'
  const address = ACCOUNT_ADDRESSES[0]

  it('can make a claim', async () => {
    const metadata = IdentityMetadataWrapper.fromEmpty(address)
    await metadata.addClaim(
      createAttestationServiceURLClaim(url),
      NativeSigner(kit.web3.eth.sign, address)
    )
  })

  it('can overwrite the existing claim', async () => {
    const metadata = IdentityMetadataWrapper.fromEmpty(address)
    await metadata.addClaim(
      createAttestationServiceURLClaim(url),
      NativeSigner(kit.web3.eth.sign, address)
    )

    const newUrl = 'https://example.com/new'
    await metadata.addClaim(
      createAttestationServiceURLClaim(newUrl),
      NativeSigner(kit.web3.eth.sign, address)
    )

    expect(metadata.claims).toHaveLength(1)
  })
})
