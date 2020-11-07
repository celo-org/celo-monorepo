import { ACCOUNT_PRIVATE_KEYS } from '@celo/dev-utils/lib/ganache-setup'
import { testWithGanache } from '@celo/dev-utils/lib/ganache-test'
import {
  ensureLeading0x,
  privateKeyToPublicKey,
  publicKeyToAddress,
  toChecksumAddress,
} from '@celo/utils/lib/address'
import { ensureCompressed } from '@celo/utils/lib/ecdh'
import { NativeSigner, serializeSignature } from '@celo/utils/lib/signatureUtils'
import { randomBytes } from 'crypto'
import { ContractKit, newKitFromWeb3 } from '../kit'
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

interface RegisteredAccount {
  wrapper: OffchainDataWrapper
  privateKey: string
  publicKey: string
  address: string
  storageRoot: string
  localStorageRoot: string
  kit: ContractKit
}

testWithGanache('Offchain Data', (web3) => {
  const kit = newKitFromWeb3(web3)

  const writerPrivate = ACCOUNT_PRIVATE_KEYS[0]
  const readerPrivate = ACCOUNT_PRIVATE_KEYS[1]
  const reader2Private = ACCOUNT_PRIVATE_KEYS[2]
  const signerPrivate = ACCOUNT_PRIVATE_KEYS[3]

  const writerEncryptionKeyPrivate = ensureLeading0x(randomBytes(32).toString('hex'))
  const readerEncryptionKeyPrivate = ensureLeading0x(randomBytes(32).toString('hex'))
  const reader2EncryptionKeyPrivate = ensureLeading0x(randomBytes(32).toString('hex'))

  let accounts: AccountsWrapper
  let writer: RegisteredAccount
  let reader: RegisteredAccount
  let reader2: RegisteredAccount
  let signer: RegisteredAccount

  async function setupAccount(
    privateKey: string,
    dek?: string,
    compressedDEK = false
  ): Promise<RegisteredAccount> {
    const publicKey = privateKeyToPublicKey(privateKey)
    const address = publicKeyToAddress(publicKey)
    const metadataURL = `http://example.com/${address}/metadata`
    const storageRoot = `http://example.com/${address}/root`
    const localStorageRoot = `/tmp/offchain/${address}`

    accounts = await kit.contracts.getAccounts()
    await accounts.createAccount().sendAndWaitForReceipt({ from: address })

    if (dek) {
      await accounts
        .setAccountDataEncryptionKey(
          compressedDEK
            ? ensureLeading0x(ensureCompressed(privateKeyToPublicKey(dek)))
            : privateKeyToPublicKey(dek)
        )
        .sendAndWaitForReceipt({ from: address })
      kit.addAccount(dek)
    }

    const metadata = IdentityMetadataWrapper.fromEmpty(address)
    await metadata.addClaim(createStorageClaim(storageRoot), NativeSigner(web3.eth.sign, address))

    fetchMock.mock(metadataURL, metadata.toString())
    await accounts.setMetadataURL(metadataURL).sendAndWaitForReceipt({ from: address })

    kit.addAccount(privateKey)

    const wrapper = new OffchainDataWrapper(address, kit)
    wrapper.storageWriter = new MockStorageWriter(localStorageRoot, storageRoot, fetchMock)

    return { wrapper, privateKey, publicKey, address, storageRoot, localStorageRoot, kit }
  }

  beforeEach(async () => {
    writer = await setupAccount(writerPrivate, writerEncryptionKeyPrivate)
    reader = await setupAccount(readerPrivate, readerEncryptionKeyPrivate)
    reader2 = await setupAccount(reader2Private, reader2EncryptionKeyPrivate)
    signer = await setupAccount(signerPrivate)
  })

  afterEach(() => {
    fetchMock.reset()
    writer.kit.getWallet().removeAccount(writer.address)
    reader.kit.getWallet().removeAccount(reader.address)
    reader2.kit.getWallet().removeAccount(reader2.address)
    signer.kit.getWallet().removeAccount(signer.address)
  })

  describe('with the account being the signer', () => {
    it('can write a name', async () => {
      const nameAccessor = new PublicNameAccessor(writer.wrapper)
      await nameAccessor.write(testPayload)

      const readerNameAccessor = new PublicNameAccessor(reader.wrapper)
      const resp = await readerNameAccessor.readAsResult(writer.address)
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
      writer.storageRoot + `/account/authorizedSigners/${toChecksumAddress(signer.address)}`,
      404
    )

    const wrapper = new OffchainDataWrapper(signer.address, kit)
    wrapper.storageWriter = new MockStorageWriter(
      writer.localStorageRoot,
      writer.storageRoot,
      fetchMock
    )
    const nameAccessor = new PublicNameAccessor(wrapper)
    await nameAccessor.write(testPayload)

    const receivedName = await nameAccessor.readAsResult(writer.address)
    expect(receivedName.ok).toEqual(false)
    const authorizedSignerAccessor = new AuthorizedSignerAccessor(writer.wrapper)
    const authorization = await authorizedSignerAccessor.readAsResult(
      writer.address,
      signer.address
    )
    expect(authorization.ok).toEqual(false)
  })

  describe('with a different key being authorized to sign off-chain', () => {
    beforeEach(async () => {
      const pop = await accounts.generateProofOfKeyPossession(writer.address, signer.address)
      const authorizedSignerAccessor = new AuthorizedSignerAccessor(writer.wrapper)
      await authorizedSignerAccessor.write(signer.address, serializeSignature(pop), '.*')
    })

    it('can read the authorization', async () => {
      const authorizedSignerAccessor = new AuthorizedSignerAccessor(reader.wrapper)
      const authorization = await authorizedSignerAccessor.readAsResult(
        writer.address,
        signer.address
      )
      expect(authorization).toBeDefined()
    })

    it('can write a name', async () => {
      const nameAccessor = new PublicNameAccessor(signer.wrapper)
      await nameAccessor.write(testPayload)

      const readerNameAccessor = new PublicNameAccessor(reader.wrapper)
      const resp = await readerNameAccessor.readAsResult(writer.address)
      if (resp.ok) {
        expect(resp.result.name).toEqual(testname)
      }
    })
  })

  describe('with a reader that has a dataEncryptionKey registered', () => {
    it('encrypted data can be read and written', async () => {
      const writerNameAccessor = new PrivateNameAccessor(writer.wrapper)
      await writerNameAccessor.write(testPayload, [reader.address])

      const readerNameAccessor = new PrivateNameAccessor(reader.wrapper)
      const receivedName = await readerNameAccessor.readAsResult(writer.address)

      if (receivedName.ok) {
        expect(receivedName.result.name).toEqual(testname)
      } else {
        console.error(receivedName.error)
        throw new Error('should not get here')
      }
    })

    it('trying to read encrypted data without an encrypted accessor fails', async () => {
      const nameAccessor = new PrivateNameAccessor(writer.wrapper)
      await nameAccessor.write(testPayload, [reader.address])

      const readerNameAccessor = new PublicNameAccessor(reader.wrapper)
      const receivedName = await readerNameAccessor.readAsResult(writer.address)

      if (receivedName.ok) {
        throw new Error('Should not be able to read data without encrypted name accessor')
      }
      expect(receivedName.error.errorType).toBe(SchemaErrorTypes.OffchainError)
      // @ts-ignore
      expect(receivedName.error.error.errorType).toBe(OffchainErrorTypes.NoStorageRootProvidedData)
    })

    it('can re-encrypt data to more recipients', async () => {
      const nameAccessor = new PrivateNameAccessor(writer.wrapper)
      await nameAccessor.write(testPayload, [reader.address])
      await nameAccessor.write(testPayload, [reader2.address])

      const readerNameAccessor = new PrivateNameAccessor(reader.wrapper)
      const receivedName = await readerNameAccessor.readAsResult(writer.address)
      const reader2NameAccessor = new PrivateNameAccessor(reader2.wrapper)
      const receivedName2 = await reader2NameAccessor.readAsResult(writer.address)

      if (receivedName.ok && receivedName2.ok) {
        expect(receivedName.result.name).toEqual(testname)
        expect(receivedName2.result.name).toEqual(testname)
      } else {
        throw new Error('should not get here')
      }
    })

    it('can encrypt data with user defined symmetric key', async () => {
      const symmetricKey = randomBytes(16)

      const nameAccessor = new PrivateNameAccessor(writer.wrapper)
      await nameAccessor.write(testPayload, [reader.address], symmetricKey)

      const readerNameAccessor = new PrivateNameAccessor(reader.wrapper)
      const receivedName = await readerNameAccessor.readAsResult(writer.address)

      if (receivedName.ok) {
        expect(receivedName.result.name).toEqual(testname)
      } else {
        console.error(receivedName.error)
        throw new Error('should not get here')
      }
    })

    describe('when the key is not added to the wallet', () => {
      beforeEach(() => {
        reader.kit
          .getWallet()
          .removeAccount(publicKeyToAddress(privateKeyToPublicKey(readerEncryptionKeyPrivate)))
      })

      it('the reader cannot decrypt the data', async () => {
        const nameAccessor = new PrivateNameAccessor(writer.wrapper)
        await nameAccessor.write(testPayload, [reader.address])

        const readerNameAccessor = new PrivateNameAccessor(reader.wrapper)
        const receivedName = await readerNameAccessor.readAsResult(writer.address)

        if (receivedName.ok) {
          throw new Error('Should not get here')
        }

        expect(receivedName.error.errorType).toEqual(SchemaErrorTypes.UnavailableKey)
      })
    })
  })

  describe('when data encryption keys are compressed', () => {
    it('works when the writer has a compressed key', async () => {
      const writerPrivateKey = ACCOUNT_PRIVATE_KEYS[4]
      const writerDEK = randomBytes(32).toString('hex')
      const compressedWriter = await setupAccount(writerPrivateKey, writerDEK, true)
      compressedWriter.wrapper.kit.addAccount(writerDEK)

      const writerNameAccessor = new PrivateNameAccessor(compressedWriter.wrapper)
      const readerNameAccessor = new PrivateNameAccessor(reader.wrapper)

      await writerNameAccessor.write(testPayload, [reader.address])
      const receivedName = await readerNameAccessor.readAsResult(compressedWriter.address)
      if (receivedName.ok) {
        expect(receivedName.result.name).toEqual(testname)
      } else {
        console.error(receivedName.error)
        throw new Error('should not get here')
      }
    })

    it('works when the reader has a compressed key', async () => {
      const readerPrivateKey = ACCOUNT_PRIVATE_KEYS[7]
      const readerDEK = randomBytes(32).toString('hex')
      const compressedReader = await setupAccount(readerPrivateKey, readerDEK, true)
      compressedReader.wrapper.kit.addAccount(readerDEK)

      const writerNameAccessor = new PrivateNameAccessor(writer.wrapper)
      const readerNameAccessor = new PrivateNameAccessor(compressedReader.wrapper)

      await writerNameAccessor.write(testPayload, [compressedReader.address])
      const receivedName = await readerNameAccessor.readAsResult(writer.address)
      if (receivedName.ok) {
        expect(receivedName.result.name).toEqual(testname)
      } else {
        console.error(receivedName.error)
        throw new Error('should not get here')
      }
    })

    it('works when both the reader and the writer have compressed keys', async () => {
      const writerPrivateKey = ACCOUNT_PRIVATE_KEYS[8]
      const writerDEK = randomBytes(32).toString('hex')
      const compressedWriter = await setupAccount(writerPrivateKey, writerDEK, true)
      compressedWriter.wrapper.kit.addAccount(writerDEK)

      const readerPrivateKey = ACCOUNT_PRIVATE_KEYS[9]
      const readerDEK = randomBytes(32).toString('hex')
      const compressedReader = await setupAccount(readerPrivateKey, readerDEK, true)
      compressedReader.wrapper.kit.addAccount(readerDEK)

      const writerNameAccessor = new PrivateNameAccessor(compressedWriter.wrapper)
      const readerNameAccessor = new PrivateNameAccessor(compressedReader.wrapper)

      await writerNameAccessor.write(testPayload, [compressedReader.address])
      const receivedName = await readerNameAccessor.readAsResult(compressedWriter.address)
      if (receivedName.ok) {
        expect(receivedName.result.name).toEqual(testname)
      } else {
        console.error(receivedName.error)
        throw new Error('should not get here')
      }
    })
  })
})
