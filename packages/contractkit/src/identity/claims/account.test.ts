import { ACCOUNT_ADDRESSES, ACCOUNT_PRIVATE_KEYS } from '@celo/dev-utils/lib/ganache-setup'
import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import { privateKeyToAddress, privateKeyToPublicKey } from '@celo/utils/lib/address'
import { NativeSigner } from '@celo/utils/lib/signatureUtils'
import { newKitFromWeb3 } from '../../kit'
import { IdentityMetadataWrapper } from '../metadata'
import { createAccountClaim } from './account'
import { Claim } from './claim'
import { verifyClaim } from './verify'

testWithGanache('Account claims', (web3) => {
  const kit = newKitFromWeb3(web3)
  const address = ACCOUNT_ADDRESSES[0]
  const otherAddress = ACCOUNT_ADDRESSES[1]

  it('can make an account claim', async () => {
    const metadata = IdentityMetadataWrapper.fromEmpty(address)
    await metadata.addClaim(
      createAccountClaim(otherAddress),
      NativeSigner(kit.web3.eth.sign, address)
    )
  })

  it('can make an account claim with the public key', async () => {
    const metadata = IdentityMetadataWrapper.fromEmpty(address)
    const otherKey = ACCOUNT_PRIVATE_KEYS[1]
    await metadata.addClaim(
      createAccountClaim(privateKeyToAddress(otherKey), privateKeyToPublicKey(otherKey)),
      NativeSigner(kit.web3.eth.sign, address)
    )
  })

  it("can't claim itself", async () => {
    const metadata = IdentityMetadataWrapper.fromEmpty(address)
    await expect(
      metadata.addClaim(createAccountClaim(address), NativeSigner(kit.web3.eth.sign, address))
    ).rejects.toEqual(new Error("Can't claim self"))
  })

  it('fails to create a claim with in invalid address', () => {
    expect(() => {
      createAccountClaim('notanaddress')
    }).toThrow()
  })

  it('fails when passing a public key that is derived from a different private key', async () => {
    const key1 = ACCOUNT_PRIVATE_KEYS[0]
    const key2 = ACCOUNT_PRIVATE_KEYS[1]

    expect(() =>
      createAccountClaim(privateKeyToAddress(key1), privateKeyToPublicKey(key2))
    ).toThrow()
  })

  describe('verifying', () => {
    let claim: Claim
    let otherMetadata: IdentityMetadataWrapper

    // Mocking static function calls was too difficult, so manually mocking it
    const originalFetchFromURLImplementation = IdentityMetadataWrapper.fetchFromURL

    beforeEach(async () => {
      otherMetadata = IdentityMetadataWrapper.fromEmpty(otherAddress)

      const myUrl = 'https://www.test.com/'
      const accounts = await kit.contracts.getAccounts()
      await accounts.createAccount().send({ from: address })
      await accounts.setMetadataURL(myUrl).send({ from: address })
      await accounts.createAccount().send({ from: otherAddress })
      await accounts.setMetadataURL(myUrl).send({ from: otherAddress })

      IdentityMetadataWrapper.fetchFromURL = () => Promise.resolve(otherMetadata)

      const metadata = IdentityMetadataWrapper.fromEmpty(address)
      claim = createAccountClaim(otherAddress)
      await metadata.addClaim(claim, NativeSigner(kit.web3.eth.sign, address))
    })

    afterEach(() => {
      IdentityMetadataWrapper.fetchFromURL = originalFetchFromURLImplementation
    })

    describe('when the metadata URL of the other account has not been set', () => {
      beforeEach(async () => {
        await (await kit.contracts.getAccounts()).setMetadataURL('').send({ from: otherAddress })
      })

      it('indicates that the metadata url could not be retrieved', async () => {
        const error = await verifyClaim(kit, claim, address)
        expect(error).toContain('could not be retrieved')
      })
    })

    describe('when the metadata URL is set, but does not contain the address claim', () => {
      it('indicates that the metadata does not contain the counter claim', async () => {
        const error = await verifyClaim(kit, claim, address)
        expect(error).toContain('did not claim')
      })
    })

    describe('when the other account correctly counter-claims', () => {
      beforeEach(async () => {
        await otherMetadata.addClaim(
          createAccountClaim(address),
          NativeSigner(kit.web3.eth.sign, otherAddress)
        )
      })

      it('returns undefined succesfully', async () => {
        const error = await verifyClaim(kit, claim, address)
        expect(error).toBeUndefined()
      })
    })
  })
})
