import { ACCOUNT_PRIVATE_KEYS } from '@celo/dev-utils/lib/ganache-setup'
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

const testname = 'test'
const testPayload = { name: testname }

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

  const signerPrivate = ACCOUNT_PRIVATE_KEYS[3]
  const signerPublic = privateKeyToPublicKey(signerPrivate)
  const signerAddress = publicKeyToAddress(signerPublic)
  // const reader = ACCOUNT_ADDRESSES[2]

  // kit.addAccount(writerPrivate)

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
  let reader2Wrapper: OffchainDataWrapper

  beforeEach(async () => {
    accounts = await kit.contracts.getAccounts()
    await accounts.createAccount().sendAndWaitForReceipt({ from: writerAddress })

    await accounts
      .setAccountDataEncryptionKey(writerEncryptionKeyPublic)
      .sendAndWaitForReceipt({ from: writerAddress })

    // kit.addAccount(writerPrivate) todo: why does this break everything
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
    reader2Wrapper = new OffchainDataWrapper(reader2Address, kit)
  })

  afterEach(() => {
    fetchMock.reset()

    // todo: uncomment
    // kit.removeAccount(writerAddress)
  })

  describe('with the account being the signer', () => {
    it('can write a name', async () => {
      // todo: remove this
      kit.addAccount(writerPrivate)
      kit.defaultAccount = writerAddress

      const nameAccessor = new NameAccessor(wrapper)
      await nameAccessor.write(testPayload)

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
                console.log("Account doesn't have data for this type")
                break
            }

          default:
            break
        }
        throw new Error(error.message)
      }

      // todo: remove this
      kit.removeAccount(writerAddress)
    })
  })

  it('cannot write with a signer that is not authorized', async () => {
    // Mock the 404
    fetchMock.mock(
      WRITER_STORAGE_ROOT + `/account/authorizedSigners/${toChecksumAddress(signerAddress)}`,
      404
    )

    kit.addAccount(signerPrivate)

    wrapper = new OffchainDataWrapper(signerAddress, kit)
    wrapper.storageWriter = new MockStorageWriter(
      WRITER_LOCAL_STORAGE_ROOT,
      WRITER_STORAGE_ROOT,
      fetchMock
    )

    const nameAccessor = new NameAccessor(wrapper)
    await nameAccessor.write(testPayload)

    const receivedName = await nameAccessor.readAsResult(writerAddress)
    expect(receivedName.ok).toEqual(false)
    const authorizedSignerAccessor = new AuthorizedSignerAccessor(wrapper)
    const authorization = await authorizedSignerAccessor.readAsResult(writerAddress, signerAddress)
    expect(authorization.ok).toEqual(false)

    kit.removeAccount(signerAddress)
  })

  describe('with a different key being authorized to sign off-chain', () => {
    beforeEach(async () => {
      wrapper = new OffchainDataWrapper(writerAddress, kit)
      wrapper.storageWriter = new MockStorageWriter(
        WRITER_LOCAL_STORAGE_ROOT,
        WRITER_STORAGE_ROOT,
        fetchMock
      )

      kit.addAccount(writerPrivate)

      const pop = await accounts.generateProofOfKeyPossession(writerAddress, signerAddress)
      const authorizedSignerAccessor = new AuthorizedSignerAccessor(wrapper)
      await authorizedSignerAccessor.write(signerAddress, serializeSignature(pop), '.*')

      kit.addAccount(signerPrivate)
    })

    afterEach(() => {
      kit.removeAccount(signerAddress)
      kit.removeAccount(writerAddress)
    })

    it('can read the authorization', async () => {
      const authorizedSignerAccessor = new AuthorizedSignerAccessor(wrapper)
      const authorization = await authorizedSignerAccessor.readAsResult(
        writerAddress,
        signerAddress
      )
      expect(authorization).toBeDefined()
    })

    it('can write a name', async () => {
      const nameAccessor = new NameAccessor(wrapper)
      await nameAccessor.write(testPayload)

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

      await accounts.createAccount().sendAndWaitForReceipt({ from: reader2Address })
      await accounts
        .setAccountDataEncryptionKey(readerEncryptionKeyPublic)
        .sendAndWaitForReceipt({ from: reader2Address })

      // todo: remove this
      kit.addAccount(writerPrivate)
    })

    afterEach(() => {
      // todo: remove this
      kit.removeAccount(writerAddress)
    })

    describe('when the key is added to the wallet', () => {
      beforeEach(() => {
        kit.addAccount(readerEncryptionKeyPrivate)
      })

      afterEach(() => {
        kit.removeAccount(publicKeyToAddress(readerEncryptionKeyPublic))
      })

      it("the writer can encrypt data directly to the reader's dataEncryptionKey", async () => {
        const nameAccessor = new NameAccessor(wrapper)
        await nameAccessor.writeEncrypted(testPayload, readerAddress)

        const readerNameAccessor = new NameAccessor(readerWrapper)
        const receivedName = await readerNameAccessor.readAsResult(writerAddress)

        if (receivedName.ok) {
          expect(receivedName.result.name).toEqual(testname)
        } else {
          console.error(receivedName.error)
          throw new Error('should not get here')
        }
      })

      describe('symmetric encryption', () => {
        it('can encrypt data with generated symmetric key', async () => {
          const nameAccessor = new NameAccessor(wrapper)
          await nameAccessor.writeWithSymmetric(testPayload, [readerAddress])

          const readerNameAccessor = new NameAccessor(readerWrapper)
          const receivedName = await readerNameAccessor.readAsResult(writerAddress)

          if (receivedName.ok) {
            expect(receivedName.result.name).toEqual(testname)
          } else {
            console.error(receivedName.error)
            throw new Error('should not get here')
          }
        })

        it('can re-encrypt data to more recipients', async () => {
          const nameAccessor = new NameAccessor(wrapper)
          await nameAccessor.writeWithSymmetric(testPayload, [readerAddress])
          await nameAccessor.writeWithSymmetric(testPayload, [reader2Address])

          const readerNameAccessor = new NameAccessor(readerWrapper)
          const receivedName = await readerNameAccessor.readAsResult(writerAddress)
          const reader2NameAccessor = new NameAccessor(reader2Wrapper)
          const receivedName2 = await reader2NameAccessor.readAsResult(writerAddress)

          if (receivedName.ok && receivedName2.ok) {
            expect(receivedName.result.name).toEqual(testname)
            expect(receivedName2.result.name).toEqual(testname)
          } else {
            throw new Error('should not get here')
          }
        })

        it('can encrypt data with user defined symmetric key', async () => {
          const symmetricKey = randomBytes(16)

          const nameAccessor = new NameAccessor(wrapper)
          await nameAccessor.writeWithSymmetric(testPayload, [readerAddress], symmetricKey)

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
    })

    describe('when the key is not added to the wallet', () => {
      it('the reader cannot decrypt the data', async () => {
        const nameAccessor = new NameAccessor(wrapper)
        await nameAccessor.writeEncrypted(testPayload, readerAddress)

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
