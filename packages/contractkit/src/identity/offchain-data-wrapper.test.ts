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
import { AuthorizedSignerAccessor } from './offchain/accessors/authorized-signer'
import { SchemaErrorTypes } from './offchain/accessors/errors'
import { PrivateNameAccessor, PublicNameAccessor } from './offchain/accessors/name'
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
  const reader2Address = publicKeyToAddress(reader2Public)

  const signerPrivate = ACCOUNT_PRIVATE_KEYS[3]
  const signerPublic = privateKeyToPublicKey(signerPrivate)
  const signerAddress = publicKeyToAddress(signerPublic)

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
    // kit = newKitFromWeb3(web3)

    accounts = await kit.contracts.getAccounts()
    await accounts.createAccount().sendAndWaitForReceipt({ from: writerAddress })

    await accounts
      .setAccountDataEncryptionKey(writerEncryptionKeyPublic)
      .sendAndWaitForReceipt({ from: writerAddress })

    const metadata = IdentityMetadataWrapper.fromEmpty(writerAddress)
    await metadata.addClaim(
      createStorageClaim(WRITER_STORAGE_ROOT),
      NativeSigner(web3.eth.sign, writerAddress)
    )

    fetchMock.mock(WRITER_METADATA_URL, metadata.toString())
    await accounts
      .setMetadataURL(WRITER_METADATA_URL)
      .sendAndWaitForReceipt({ from: writerAddress })

    kit.addAccount(writerPrivate)

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
    kit.getWallet().removeAccount(writerAddress)
  })

  describe('with the account being the signer', () => {
    it('can write a name', async () => {
      const nameAccessor = new PublicNameAccessor(wrapper)
      await nameAccessor.write(testPayload)

      const readerNameAccessor = new PublicNameAccessor(readerWrapper)
      const resp = await readerNameAccessor.readAsResult(writerAddress)
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
    })
  })

  it('cannot write with a signer that is not authorized', async () => {
    // Mock the 404
    fetchMock.mock(
      WRITER_STORAGE_ROOT + `/account/authorizedSigners/${toChecksumAddress(signerAddress)}`,
      404
    )

    // this is so it doesn't fail on writing
    kit.addAccount(signerPrivate)

    wrapper = new OffchainDataWrapper(signerAddress, kit)
    wrapper.storageWriter = new MockStorageWriter(
      WRITER_LOCAL_STORAGE_ROOT,
      WRITER_STORAGE_ROOT,
      fetchMock
    )

    const nameAccessor = new PublicNameAccessor(wrapper)
    await nameAccessor.write(testPayload)

    const receivedName = await nameAccessor.readAsResult(writerAddress)
    expect(receivedName.ok).toEqual(false)
    const authorizedSignerAccessor = new AuthorizedSignerAccessor(wrapper)
    const authorization = await authorizedSignerAccessor.readAsResult(writerAddress, signerAddress)
    expect(authorization.ok).toEqual(false)

    kit.getWallet().removeAccount(signerAddress)
  })

  describe('with a different key being authorized to sign off-chain', () => {
    let signerWrapper: OffchainDataWrapper

    beforeEach(async () => {
      const pop = await accounts.generateProofOfKeyPossession(writerAddress, signerAddress)
      const authorizedSignerAccessor = new AuthorizedSignerAccessor(wrapper)
      await authorizedSignerAccessor.write(signerAddress, serializeSignature(pop), '.*')

      signerWrapper = new OffchainDataWrapper(writerAddress, kit, signerAddress)
      signerWrapper.storageWriter = new MockStorageWriter(
        WRITER_LOCAL_STORAGE_ROOT,
        WRITER_STORAGE_ROOT,
        fetchMock
      )

      kit.addAccount(signerPrivate)
    })

    afterEach(() => {
      kit.getWallet().removeAccount(signerAddress)
    })

    it('can read the authorization', async () => {
      const authorizedSignerAccessor = new AuthorizedSignerAccessor(readerWrapper)
      const authorization = await authorizedSignerAccessor.readAsResult(
        writerAddress,
        signerAddress
      )
      expect(authorization).toBeDefined()
    })

    it('can write a name', async () => {
      const nameAccessor = new PublicNameAccessor(signerWrapper)
      await nameAccessor.write(testPayload)

      const readerNameAccessor = new PublicNameAccessor(readerWrapper)
      const resp = await readerNameAccessor.readAsResult(writerAddress)
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

      kit.addAccount(writerEncryptionKeyPrivate)
    })

    describe('when the key is added to the wallet', () => {
      beforeEach(() => {
        kit.addAccount(readerEncryptionKeyPrivate)
      })

      afterEach(() => {
        kit.getWallet().removeAccount(publicKeyToAddress(readerEncryptionKeyPublic))
      })

      it('encrypted data can be read and written', async () => {
        const nameAccessor = new PrivateNameAccessor(wrapper)
        await nameAccessor.write(testPayload, [readerAddress])

        const readerNameAccessor = new PrivateNameAccessor(readerWrapper)
        const receivedName = await readerNameAccessor.readAsResult(writerAddress)

        if (receivedName.ok) {
          expect(receivedName.result.name).toEqual(testname)
        } else {
          console.error(receivedName.error)
          throw new Error('should not get here')
        }
      })

      it('trying to read encrypted data without an encrypted accessor fails', async () => {
        const nameAccessor = new PrivateNameAccessor(wrapper)
        await nameAccessor.write(testPayload, [readerAddress])

        const readerNameAccessor = new PublicNameAccessor(readerWrapper)
        const receivedName = await readerNameAccessor.readAsResult(writerAddress)

        if (receivedName.ok) {
          throw new Error('Should not be able to read data without encrypted name accessor')
        }
        expect(receivedName.error.errorType).toBe(SchemaErrorTypes.OffchainError)
        // @ts-ignore
        expect(receivedName.error.error.errorType).toBe(
          OffchainErrorTypes.NoStorageRootProvidedData
        )
      })

      it('can re-encrypt data to more recipients', async () => {
        const nameAccessor = new PrivateNameAccessor(wrapper)
        await nameAccessor.write(testPayload, [readerAddress])
        await nameAccessor.write(testPayload, [reader2Address])

        const readerNameAccessor = new PrivateNameAccessor(readerWrapper)
        const receivedName = await readerNameAccessor.readAsResult(writerAddress)
        const reader2NameAccessor = new PrivateNameAccessor(reader2Wrapper)
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

        const nameAccessor = new PrivateNameAccessor(wrapper)
        await nameAccessor.write(testPayload, [readerAddress], symmetricKey)

        const readerNameAccessor = new PrivateNameAccessor(readerWrapper)
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
        const nameAccessor = new PrivateNameAccessor(wrapper)
        await nameAccessor.write(testPayload, [readerAddress])

        const readerNameAccessor = new PrivateNameAccessor(readerWrapper)
        const receivedName = await readerNameAccessor.readAsResult(writerAddress)

        if (receivedName.ok) {
          throw new Error('Should not get here')
        }

        expect(receivedName.error.errorType).toEqual(SchemaErrorTypes.UnavailableKey)
      })
    })
  })
})
