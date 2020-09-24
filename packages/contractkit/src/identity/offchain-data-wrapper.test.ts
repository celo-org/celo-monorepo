import { ACCOUNT_ADDRESSES, ACCOUNT_PRIVATE_KEYS } from '@celo/dev-utils/lib/ganache-setup'
import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import {
  privateKeyToPublicKey,
  publicKeyToAddress,
  toChecksumAddress,
} from '@celo/utils/lib/address'
import { NativeSigner, serializeSignature } from '@celo/utils/lib/signatureUtils'
import { newKitFromWeb3 } from '../kit'
import { AccountsWrapper } from '../wrappers/Accounts'
import { createStorageClaim } from './claims/claim'
import { IdentityMetadataWrapper } from './metadata'
import OffchainDataWrapper, { OffchainErrorTypes } from './offchain-data-wrapper'
import { SchemaErrorTypes } from './offchain/schema-utils'
import { AuthorizedSignerAccessor, NameAccessor } from './offchain/schemas'
import { MockStorageWriter } from './offchain/storage-writers'

testWithGanache('Offchain Data', (web3) => {
  const kit = newKitFromWeb3(web3)

  const writerPrivate = ACCOUNT_PRIVATE_KEYS[0]
  const writerPublic = privateKeyToPublicKey(writerPrivate)
  const writerAddress = publicKeyToAddress(writerPublic)

  const readerPrivate = ACCOUNT_PRIVATE_KEYS[1]
  const readerPublic = privateKeyToPublicKey(readerPrivate)
  const readerAddress = publicKeyToAddress(readerPublic)

  const reader2Private = ACCOUNT_PRIVATE_KEYS[2]
  const reader2Public = privateKeyToPublicKey(reader2Private)
  // @ts-ignore
  const reader2Address = publicKeyToAddress(reader2Public)

  const signer = ACCOUNT_ADDRESSES[3]
  // const reader = ACCOUNT_ADDRESSES[2]

  // const readerEncryptionKeyPrivate = ensureLeading0x(randomBytes(32).toString('hex'))
  // const readerEncryptionKeyPublic = privateKeyToPublicKey(readerEncryptionKeyPrivate)

  const WRITER_METADATA_URL = 'http://example.com/writer'
  const WRITER_STORAGE_ROOT = 'http://example.com/root'
  const WRITER_LOCAL_STORAGE_ROOT = `/tmp/offchain/${writerAddress}`
  let accounts: AccountsWrapper
  let wrapper: OffchainDataWrapper

  beforeEach(async () => {
    accounts = await kit.contracts.getAccounts()
    await accounts.createAccount().sendAndWaitForReceipt({ from: writerAddress })

    const metadata = IdentityMetadataWrapper.fromEmpty(writerAddress)
    await metadata.addClaim(
      createStorageClaim(WRITER_STORAGE_ROOT),
      NativeSigner(web3.eth.sign, writerAddress)
    )

    fetchMock.mock(WRITER_METADATA_URL, metadata.toString())
    await accounts
      .setMetadataURL(WRITER_METADATA_URL)
      .sendAndWaitForReceipt({ from: writerAddress })

    wrapper = new OffchainDataWrapper(writerAddress, kit)
    wrapper.storageWriter = new MockStorageWriter(
      WRITER_LOCAL_STORAGE_ROOT,
      WRITER_STORAGE_ROOT,
      fetchMock
    )
  })

  afterEach(() => {
    fetchMock.reset()
  })

  describe('with the account being the signer', () => {
    it('can write a name', async () => {
      const testname = 'test'
      const nameAccessor = new NameAccessor(wrapper)
      await nameAccessor.write({ name: testname })

      const resp = await nameAccessor.read(writerAddress)
      if (resp.ok) {
        expect(resp.result.name).toEqual(testname)
      } else {
        const error = resp.error
        switch (error.errorType) {
          case SchemaErrorTypes.InvalidDataError:
            console.log("Something was wrong with the schema, can't try again")
            break
          case SchemaErrorTypes.OffchainError:
            const offchainError = error.error
            switch (offchainError.errorType) {
              case OffchainErrorTypes.FetchError:
                console.log('Something went wrong with fetching, try again')
                break
              case OffchainErrorTypes.InvalidSignature:
                console.log('Signature was wrong')
                break
              case OffchainErrorTypes.NoStorageRootProvidedData:
                console.log('Account has not data for this type')
                break
            }

          default:
            break
        }
      }
    })
  })

  it('cannot write with a signer that is not authorized', async () => {
    // Mock the 404
    fetchMock.mock(
      WRITER_STORAGE_ROOT + `/account/authorizedSigners/${toChecksumAddress(signer)}`,
      404
    )

    wrapper = new OffchainDataWrapper(signer, kit)
    wrapper.storageWriter = new MockStorageWriter(
      WRITER_LOCAL_STORAGE_ROOT,
      WRITER_STORAGE_ROOT,
      fetchMock
    )

    const testname = 'test'
    const nameAccessor = new NameAccessor(wrapper)
    await nameAccessor.write({ name: testname })

    const receivedName = await nameAccessor.read(writerAddress)
    expect(receivedName.ok).toEqual(false)
    const authorizedSignerAccessor = new AuthorizedSignerAccessor(wrapper)
    const authorization = await authorizedSignerAccessor.read(writerAddress, signer)
    expect(authorization.ok).toEqual(false)
  })

  describe('with a different key being authorized to sign off-chain', () => {
    beforeEach(async () => {
      wrapper = new OffchainDataWrapper(writerAddress, kit)
      wrapper.storageWriter = new MockStorageWriter(
        WRITER_LOCAL_STORAGE_ROOT,
        WRITER_STORAGE_ROOT,
        fetchMock
      )

      const authorizedSignerAccessor = new AuthorizedSignerAccessor(wrapper)
      const pop = await accounts.generateProofOfKeyPossession(writerAddress, signer)
      await authorizedSignerAccessor.write(signer, serializeSignature(pop), '.*')
    })

    wrapper = new OffchainDataWrapper(signer, kit)
    wrapper.storageWriter = new MockStorageWriter(
      WRITER_LOCAL_STORAGE_ROOT,
      WRITER_STORAGE_ROOT,
      fetchMock
    )

    it('can read the authorization', async () => {
      const authorizedSignerAccessor = new AuthorizedSignerAccessor(wrapper)
      const authorization = await authorizedSignerAccessor.read(writerAddress, signer)
      expect(authorization).toBeDefined()
    })

    it('can write a name', async () => {
      const testname = 'test'
      const nameAccessor = new NameAccessor(wrapper)
      await nameAccessor.write({ name: testname })

      const resp = await nameAccessor.read(writerAddress)
      if (resp.ok) {
        expect(resp.result.name).toEqual(testname)
      }
    })
  })

  describe('encryption', () => {
    describe('when no keys are loaded in the wallet', () => {
      it('cannot write encrypted data', async () => {
        const testname = 'test'
        const payload = { name: testname }

        const nameAccessor = new NameAccessor(wrapper)

        try {
          await nameAccessor.writeEncrypted(payload, writerAddress, readerAddress)
          throw new Error("Shouldn't get here")
        } catch (e) {
          expect(e.message).toEqual(`Could not find address ${writerAddress.toLowerCase()}`)
        }
      })

      it('the reader cannot decrypt the data', async () => {
        const testname = 'test'
        const payload = { name: testname }

        const nameAccessor = new NameAccessor(wrapper)
        kit.addAccount(writerPrivate)
        await nameAccessor.writeEncrypted(payload, writerAddress, readerAddress)

        try {
          await nameAccessor.readEncrypted(writerAddress, readerAddress)
          throw new Error('Should not get here')
        } catch (e) {
          expect(e.message).toEqual(`Could not find address ${readerAddress.toLowerCase()}`)
        }

        kit.removeAccount(writerAddress)
      })
    })

    describe('using keys in the wallet', () => {
      it('reads and writes metadata', async () => {
        kit.addAccount(writerPrivate)
        kit.addAccount(readerPrivate)
        kit.addAccount(reader2Private)

        const testname = 'test'
        const payload = { name: testname }

        const nameAccessor = new NameAccessor(wrapper)

        await nameAccessor.writeEncrypted(payload, writerAddress, readerAddress)
        const receivedName = await nameAccessor.readEncrypted(writerAddress, readerAddress)
        expect(receivedName).toBeDefined()

        if (!receivedName.ok) {
          throw new Error("Shouldn't get here")
        }

        expect(receivedName.result).toEqual(payload)

        kit.removeAccount(writerAddress)
        kit.removeAccount(readerAddress)
        kit.removeAccount(reader2Address)
      })

      it('distributes a symmetric key', async () => {
        kit.addAccount(writerPrivate)
        kit.addAccount(readerPrivate)
        kit.addAccount(reader2Private)

        const testname = 'test'
        const payload = { name: testname }

        const nameAccessor = new NameAccessor(wrapper)
        await nameAccessor.writeWithSymmetric(payload, writerAddress, [
          readerAddress,
          reader2Address,
        ])

        const result1 = await nameAccessor.readEncrypted(writerAddress, readerAddress)
        const result2 = await nameAccessor.readEncrypted(writerAddress, reader2Address)

        if (!result1.ok || !result2.ok) {
          throw new Error("Shouldn't get here")
        }

        expect(result1.result.name).toEqual(testname)
        expect(result2.result.name).toEqual(testname)

        kit.removeAccount(writerAddress)
        kit.removeAccount(readerAddress)
        kit.removeAccount(reader2Address)
      })
    })
  })
})
