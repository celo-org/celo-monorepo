import { ACCOUNT_ADDRESSES } from '@celo/dev-utils/lib/ganache-setup'
import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import { NativeSigner, Signer, verifySignature } from '@celo/utils/lib/signatureUtils'
import { newKitFromWeb3 } from '../../kit'
import { IdentityMetadataWrapper } from '../metadata'
import { createDomainClaim, DomainClaim, serializeClaim } from './claim'
import { MetadataURLGetter, verifyDomainClaim } from './verify'

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
    let metadataUrlGetter: MetadataURLGetter
    let signature: string
    let signatureBase64: string
    let signer: Signer
    const myUrl = 'https://test.com'
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
      metadataUrlGetter = (_addr: string) => Promise.resolve(myUrl)
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
        console.log('serializedClaim: ' + serializeClaim(claim))
        console.log('signature: ' + signature)
        console.log('address: ' + address)
        const verifiedSignature = await verifySignature(serializeClaim(claim), signature, address)
        expect(verifiedSignature).toBeTruthy()
      })

      it('indicates a fixed signature is correct', async () => {
        let newClaim = createDomainClaim('orco.dev')
        newClaim.timestamp = 1584618795

        const newSignature = await NativeSigner(kit.web3.eth.sign, secondAddress).sign(
          serializeClaim(newClaim)
        )

        const verifiedSignature = await verifySignature(
          serializeClaim(newClaim),
          newSignature,
          secondAddress
        )
        // const base64 = 'MHgxYWRhODcyYmJiNDhkM2Q3NzE0YWFmMWNkOGY1NmRlNWIxMDgzYTM5ZjBhOTllZTFhNTc3MWZjZjJkMTIwMjAxM2ZmNTdjMzliMTAwZGIxNThmOWUzZTBmZDk1ZWZjYWVjZDI3Y2NhYzcyZjc2NWU5OTFiNTkxYTI5NzEwYzc3ZjFi'
        // const signature = Buffer.from(base64, 'base64').toString('binary')
        //
        // console.log('serializedClaim: ' + serializeClaim(claim))
        // console.log('signature: ' + signature)

        // const verifiedSignature = await verifySignature(
        //     '{"domain":"orco.dev","timestamp":1584618795,"type":"DOMAIN"}',
        //     '0x1ada872bbb48d3d7714aaf1cd8f56de5b1083a39f0a99ee1a5771fcf2d1202013ff57c39b100db158f9e3e0fd95efcaecd27ccac72f765e991b591a29710c77f1b',
        //     '0xa1ab940594c0f5d66fdd282fe7b62f0aa08d5741')
        expect(verifiedSignature).toBeTruthy()
      })
    })

    describe('when the metadata URL is set', () => {
      it('indicates that the metadata contain the right claim', async () => {
        const output = await verifyDomainClaim(claim, address, metadataUrlGetter, dnsResolver)
        expect(output).toBeUndefined()
      })

      it('indicates that the metadata does not contain the proper domain claim', async () => {
        const error = await verifyDomainClaim(claim, address, metadataUrlGetter)
        // console.log(`The message is ${error}`)
        expect(error).toContain('Unable to verify domain claim')
      })
    })
  })
})
