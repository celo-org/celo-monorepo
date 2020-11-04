import { ACCOUNT_ADDRESSES } from '@celo/dev-utils/lib/ganache-setup'
import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import { NativeSigner, Signer, verifySignature } from '@celo/utils/lib/signatureUtils'
import { newKitFromWeb3 } from '../../kit'
import { IdentityMetadataWrapper } from '../metadata'
import { createDomainClaim, DomainClaim, serializeClaim } from './claim'
import { verifyDomainRecord } from './verify'

testWithGanache('Domain claims', (web3) => {
  const kit = newKitFromWeb3(web3)
  const address = ACCOUNT_ADDRESSES[0]
  const secondAddress = ACCOUNT_ADDRESSES[1]

  it('can make a domain claim', async () => {
    const domain = 'test.com'
    const metadata = IdentityMetadataWrapper.fromEmpty(address)
    await metadata.addClaim(createDomainClaim(domain), NativeSigner(kit.web3.eth.sign, address))
  })

  describe('verifying', () => {
    let claim: DomainClaim
    let metadata: IdentityMetadataWrapper
    let signature: string
    let signatureBase64: string
    let signer: Signer
    const domain = 'test.com'
    const originalFetchFromURLImplementation = IdentityMetadataWrapper.fetchFromURL
    const dnsResolver = (
      _hostname: string,
      callback: (err: any, addresses: string[][]) => void
    ) => {
      setTimeout(() => {
        callback(null, [
          [`header=xxx`],
          [`celo-site-verification=${signatureBase64}`, `header=yyy`],
        ])
      }, 100)
    }

    beforeEach(async () => {
      signer = NativeSigner(kit.web3.eth.sign, address)
      metadata = IdentityMetadataWrapper.fromEmpty(address)
      claim = createDomainClaim(domain)

      await metadata.addClaim(claim, signer)

      IdentityMetadataWrapper.fetchFromURL = () => Promise.resolve(metadata)

      signature = await signer.sign(serializeClaim(claim))
      signatureBase64 = Buffer.from(signature, 'binary').toString('base64')
    })

    afterEach(() => {
      IdentityMetadataWrapper.fetchFromURL = originalFetchFromURLImplementation
    })

    describe('when we have a signature', () => {
      it('indicates that signature is correct', async () => {
        const verifiedSignature = await verifySignature(serializeClaim(claim), signature, address)
        expect(verifiedSignature).toBeTruthy()
      })

      it('indicates a fixed signature is correct', async () => {
        const newClaim = createDomainClaim('orco.dev')
        newClaim.timestamp = 1584618795

        const newSignature = await NativeSigner(kit.web3.eth.sign, secondAddress).sign(
          serializeClaim(newClaim)
        )

        const verifiedSignature = await verifySignature(
          serializeClaim(newClaim),
          newSignature,
          secondAddress
        )

        expect(verifiedSignature).toBeTruthy()
      })
    })

    describe('when the metadata URL is set', () => {
      it('indicates that the metadata contain the right claim', async () => {
        const output = await verifyDomainRecord(kit, claim, address, dnsResolver)
        expect(output).toBeUndefined()
      })

      it('indicates that the metadata does not contain the proper domain claim', async () => {
        const error = await verifyDomainRecord(kit, claim, address)
        expect(error).toContain('Unable to verify domain claim')
      })
    })
  })
})
