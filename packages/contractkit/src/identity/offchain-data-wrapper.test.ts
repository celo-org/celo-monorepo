import { ACCOUNT_ADDRESSES } from '@celo/dev-utils/lib/ganache-setup'
import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import {
  ensureLeading0x,
  privateKeyToPublicKey,
  publicKeyToAddress,
  toChecksumAddress,
} from '@celo/utils/lib/address'
import { NativeSigner, serializeSignature } from '@celo/utils/lib/signatureUtils'
import { randomBytes } from 'crypto'
import fetchMock from 'fetch-mock'
import { newKitFromWeb3 } from '../kit'
import { AccountsWrapper } from '../wrappers/Accounts'
import { createStorageClaim } from './claims/claim'
import { IdentityMetadataWrapper } from './metadata'
import OffchainDataWrapper from './offchain-data-wrapper'
import { EncryptionKeysAccessor } from './offchain/schema-utils'
import { AuthorizedSignerAccessor, NameAccessor } from './offchain/schemas'
import { MockStorageWriter } from './offchain/storage-writers'

testWithGanache('Offchain Data', (web3) => {
  const kit = newKitFromWeb3(web3)

  const writer = ACCOUNT_ADDRESSES[0]
  const signer = ACCOUNT_ADDRESSES[1]
  const reader = ACCOUNT_ADDRESSES[2]
  const readerEncryptionKeyPrivate = ensureLeading0x(randomBytes(32).toString('hex'))
  const readerEncryptionKeyPublic = privateKeyToPublicKey(readerEncryptionKeyPrivate)

  const WRITER_METADATA_URL = 'http://example.com/writer'
  const WRITER_STORAGE_ROOT = 'http://example.com/root'
  const WRITER_LOCAL_STORAGE_ROOT = `/tmp/offchain/${writer}`
  let accounts: AccountsWrapper
  let wrapper: OffchainDataWrapper

  beforeEach(async () => {
    accounts = await kit.contracts.getAccounts()

    await accounts.createAccount().sendAndWaitForReceipt({ from: writer })

    const metadata = IdentityMetadataWrapper.fromEmpty(writer)
    await metadata.addClaim(
      createStorageClaim(WRITER_STORAGE_ROOT),
      NativeSigner(web3.eth.sign, writer)
    )

    fetchMock.mock(WRITER_METADATA_URL, metadata.toString())
    await accounts.setMetadataURL(WRITER_METADATA_URL).sendAndWaitForReceipt({ from: writer })
  })

  afterEach(async () => {
    fetchMock.reset()
  })

  describe('with the account being the signer', () => {
    beforeEach(() => {
      wrapper = new OffchainDataWrapper(writer, kit)
      wrapper.storageWriter = new MockStorageWriter(
        WRITER_LOCAL_STORAGE_ROOT,
        WRITER_STORAGE_ROOT,
        fetchMock
      )
    })

    it('can write a name', async () => {
      const testname = 'test'
      const nameAccessor = new NameAccessor(wrapper)
      await nameAccessor.write({ name: testname })

      const receivedName = await nameAccessor.read(writer)
      expect(receivedName).toBeDefined()
      expect(receivedName!.name).toEqual(testname)
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

      const receivedName = await nameAccessor.read(writer)
      expect(receivedName).not.toBeDefined()

      const authorizedSignerAccessor = new AuthorizedSignerAccessor(wrapper)
      const authorization = await authorizedSignerAccessor.read(writer, signer)
      expect(authorization).not.toBeDefined()
    })

    describe('with a reader that has a dataEncryptionKey registered', () => {
      beforeEach(async () => {
        await accounts.createAccount().sendAndWaitForReceipt({ from: reader })
        await accounts
          .setAccountDataEncryptionKey(readerEncryptionKeyPublic)
          .sendAndWaitForReceipt({ from: reader })
      })

      describe('when the key is added to the wallet', () => {
        beforeEach(() => {
          kit.addAccount(readerEncryptionKeyPrivate)
        })

        afterEach(() => {
          kit.removeAccount(publicKeyToAddress(readerEncryptionKeyPublic))
        })

        it("the writer can encrypt data directly to the reader's dataEncryptionKey", async () => {
          const testname = 'test'
          const payload = { name: testname }

          const nameAccessor = new NameAccessor(wrapper)
          await nameAccessor.writeEncrypted(payload, [await accounts.getDataEncryptionKey(reader)])
          const receivedName = await nameAccessor.read(writer)
          expect(receivedName).toBeDefined()
        })

        it('the writer can create an encryption key and encrypt that to the readers dataEncryptionKey', async () => {
          const newKey = ensureLeading0x(randomBytes(32).toString('hex'))
          const newKeyPub = privateKeyToPublicKey(newKey)
          const testname = 'test'
          const payload = { name: testname }
          const writerNameAccessor = new NameAccessor(wrapper)
          await writerNameAccessor.writeEncrypted(payload, [], newKey)

          // Write the encryption key
          const encryptionKeys = {
            keys: {
              [newKeyPub]: {
                privateKey: newKey,
                publicKey: newKeyPub,
              },
            },
          }

          const encryptionKeysAccessor = new EncryptionKeysAccessor(wrapper)
          await encryptionKeysAccessor.writeEncrypted(
            reader,
            encryptionKeys,
            [await accounts.getDataEncryptionKey(reader)],
            newKey
          )

          const readerWrapper = new OffchainDataWrapper(reader, kit)

          const nameAccessor = new NameAccessor(readerWrapper)
          const receivedName = await nameAccessor.read(writer)
          expect(receivedName).toBeDefined()
        })
      })

      describe('when the key is not added to the wallet', () => {
        // TODO: Figure out how to get a kit/web3 instance that is connected to ganache but does not have access to the keys of prior runs
        it('the reader cannot decrypt the data', async () => {
          const testname = 'test'
          const payload = { name: testname }

          const nameAccessor = new NameAccessor(wrapper)
          await nameAccessor.writeEncrypted(payload, [await accounts.getDataEncryptionKey(reader)])
          const receivedName = await nameAccessor.read(writer)
          expect(receivedName).toBeUndefined()
        })
      })
    })
  })

  describe('with a different key being authorized to sign off-chain', () => {
    beforeEach(async () => {
      wrapper = new OffchainDataWrapper(writer, kit)
      wrapper.storageWriter = new MockStorageWriter(
        WRITER_LOCAL_STORAGE_ROOT,
        WRITER_STORAGE_ROOT,
        fetchMock
      )

      const authorizedSignerAccessor = new AuthorizedSignerAccessor(wrapper)
      const pop = await accounts.generateProofOfKeyPossession(writer, signer)
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
      const authorization = await authorizedSignerAccessor.read(writer, signer)
      expect(authorization).toBeDefined()
    })

    it('can write a name', async () => {
      const testname = 'test'
      const nameAccessor = new NameAccessor(wrapper)
      await nameAccessor.write({ name: testname })

      const receivedName = await nameAccessor.read(writer)
      expect(receivedName).toBeDefined()
      expect(receivedName!.name).toEqual(testname)
    })
  })
})
