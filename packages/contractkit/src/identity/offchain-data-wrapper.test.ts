import { ACCOUNT_ADDRESSES, ACCOUNT_PRIVATE_KEYS } from '@celo/dev-utils/lib/ganache-setup'
import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import {
  ensureLeading0x,
  privateKeyToPublicKey,
  publicKeyToAddress,
  toChecksumAddress,
} from '@celo/utils/lib/address'
import { NativeSigner, serializeSignature } from '@celo/utils/lib/signatureUtils'
import { randomBytes } from 'crypto'
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

  const writerEncryptionKeyPrivate = ensureLeading0x(randomBytes(32).toString('hex'))
  const writerEncryptionKeyPublic = privateKeyToPublicKey(writerEncryptionKeyPrivate)
  const readerEncryptionKeyPrivate = ensureLeading0x(randomBytes(32).toString('hex'))
  const readerEncryptionKeyPublic = privateKeyToPublicKey(readerEncryptionKeyPrivate)

  const WRITER_METADATA_URL = 'http://example.com/writer'
  const WRITER_STORAGE_ROOT = 'http://example.com/root'
  const WRITER_LOCAL_STORAGE_ROOT = `/tmp/offchain/${writerAddress}`
  let accounts: AccountsWrapper
  let wrapper: OffchainDataWrapper
  let readerWrapper: OffchainDataWrapper

  beforeEach(async () => {
    accounts = await kit.contracts.getAccounts()
    await accounts.createAccount().sendAndWaitForReceipt({ from: writerAddress })

    await accounts
      .setAccountDataEncryptionKey(writerEncryptionKeyPublic)
      .sendAndWaitForReceipt({ from: writerAddress })

    kit.addAccount(writerEncryptionKeyPrivate)

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

    readerWrapper = new OffchainDataWrapper(readerAddress, kit)
  })

  afterEach(() => {
    fetchMock.reset()
  })

  describe('with the account being the signer', () => {
    it('can write a name', async () => {
      const testname = 'test'
      const nameAccessor = new NameAccessor(wrapper)
      await nameAccessor.write({ name: testname })

      const resp = await nameAccessor.readAsResult(writerAddress)
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

    const receivedName = await nameAccessor.readAsResult(writerAddress)
    expect(receivedName.ok).toEqual(false)
    const authorizedSignerAccessor = new AuthorizedSignerAccessor(wrapper)
    const authorization = await authorizedSignerAccessor.readAsResult(writerAddress, signer)
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
      const authorization = await authorizedSignerAccessor.readAsResult(writerAddress, signer)
      expect(authorization).toBeDefined()
    })

    it('can write a name', async () => {
      const testname = 'test'
      const nameAccessor = new NameAccessor(wrapper)
      await nameAccessor.write({ name: testname })

      const resp = await nameAccessor.readAsResult(writerAddress)
      if (resp.ok) {
        expect(resp.result.name).toEqual(testname)
      }
    })
  })

  describe('with a reader that has a dataEncryptionKey registered', () => {
    beforeEach(async () => {
      await accounts.createAccount().sendAndWaitForReceipt({ from: readerAddress })
      await accounts
        .setAccountDataEncryptionKey(readerEncryptionKeyPublic)
        .sendAndWaitForReceipt({ from: readerAddress })
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
        await nameAccessor.writeEncrypted(payload, readerAddress)

        const readerNameAccessor = new NameAccessor(readerWrapper)
        const receivedName = await readerNameAccessor.readAsResult(writerAddress)

        if (receivedName.ok) {
          expect(receivedName.result.name).toEqual(testname)
        } else {
          console.error(receivedName.error)
          throw new Error('should not get here')
        }
      })

      it('can encrypt data with symmetric keys', async () => {
        const testname = 'test'
        const payload = { name: testname }

        const nameAccessor = new NameAccessor(wrapper)
        await nameAccessor.writeWithSymmetric(payload, [readerAddress])

        const readerNameAccessor = new NameAccessor(readerWrapper)
        const receivedName = await readerNameAccessor.readAsResult(writerAddress)

        if (receivedName.ok) {
          expect(receivedName.result.name).toEqual(testname)
        } else {
          console.error(receivedName.error)
          throw new Error('should not get here')
        }
      })
    })

    describe('when the key is not added to the wallet', () => {
      it('the reader cannot decrypt the data', async () => {
        const testname = 'test'
        const payload = { name: testname }

        const nameAccessor = new NameAccessor(wrapper)
        await nameAccessor.writeEncrypted(payload, readerAddress)

        const readerNameAccessor = new NameAccessor(readerWrapper)
        const receivedName = await readerNameAccessor.readAsResult(writerAddress)

        if (receivedName.ok) {
          throw new Error('Should not get here')
        }

        expect(receivedName.error.errorType).toEqual(SchemaErrorTypes.UnavailableKey)
      })
    })
  })
})
