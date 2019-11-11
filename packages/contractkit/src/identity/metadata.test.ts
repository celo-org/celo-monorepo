import { privateKeyToAddress, privateKeyToPublicKey } from '@celo/utils/lib/address'
import { NativeSigner } from '@celo/utils/lib/signatureUtils'
import { newKitFromWeb3 } from '../kit'
import { testWithGanache } from '../test-utils/ganache-test'
import { ACCOUNT_ADDRESSES, ACCOUNT_PRIVATE_KEYS } from '../test-utils/ganache.setup'
import { createAccountClaim } from './claims/account'
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

  describe('Account claims', () => {
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
  })
})
