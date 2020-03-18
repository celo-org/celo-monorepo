import { ACCOUNT_ADDRESSES } from '@celo/dev-utils/lib/ganache-setup'
import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import { NativeSigner, verifySignature } from '@celo/utils/lib/signatureUtils'
import { newKitFromWeb3 } from '../../kit'
import { IdentityMetadataWrapper } from '../metadata'
import { createDomainClaim, DomainClaim, hashOfClaims } from './claim'
import { MetadataURLGetter, verifyDomainClaim } from './verify'

testWithGanache('Domain claims', (web3) => {
  const kit = newKitFromWeb3(web3)
  const address = ACCOUNT_ADDRESSES[0]

  it('can make a domain claim', async () => {
    const domain = 'test.com'
    const metadata = IdentityMetadataWrapper.fromEmpty(address)
    await metadata.addClaim(createDomainClaim(domain), NativeSigner(kit.web3.eth.sign, address))
  })

  describe('verifying', () => {
    let claim: DomainClaim
    let metadata: IdentityMetadataWrapper
    let metadataUrlGetter: MetadataURLGetter
    let signature: string
    let signatureBase64: string
    const signer = NativeSigner(kit.web3.eth.sign, address)
    const myUrl = 'https://test.com'
    const domain = 'test.com'
    const originalFetchFromURLImplementation = IdentityMetadataWrapper.fetchFromURL
    const dnsResolver = (_hostname: string, callback: (err: any, addresses: string[][]) => void) =>
      callback(null, [[`header=xxx`], [`celo-site-verification=${signatureBase64}`, `header=yyy`]])

    beforeEach(async () => {
      metadataUrlGetter = (_addr: string) => Promise.resolve(myUrl)

      metadata = IdentityMetadataWrapper.fromEmpty(address)
      claim = createDomainClaim(domain)

      await metadata.addClaim(claim, signer)

      IdentityMetadataWrapper.fetchFromURL = () => Promise.resolve(metadata)

      signature = JSON.parse(metadata.toString()).meta.signature
      signatureBase64 = Buffer.from(signature.toString(), 'binary').toString('base64')
    })

    afterEach(() => {
      IdentityMetadataWrapper.fetchFromURL = originalFetchFromURLImplementation
    })

    describe('when we have a signature', () => {
      it('indicates that signature is correct', async () => {
        const hasValidSiganture = await verifySignature(
          hashOfClaims(metadata.claims),
          signature,
          address
        )
        expect(hasValidSiganture).toBeTruthy()
      })
    })

    describe('when the metadata URL is set', () => {
      it('indicates that the metadata contain the right claim', async () => {
        const output = await verifyDomainClaim(claim, address, metadataUrlGetter, dnsResolver)
        expect(output).toBeUndefined()
      })

      it('indicates that the metadata does not contain the proper domain claim', async () => {
        const error = await verifyDomainClaim(claim, address, metadataUrlGetter)
        expect(error).toContain('Unable to verify domain claim')
      })
    })
  })
})
