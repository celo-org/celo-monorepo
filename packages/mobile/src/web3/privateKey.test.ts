import { getDecryptedData, getEncryptedData } from 'src/web3/privateKey'

describe(getEncryptedData, () => {
  it('encrypts and decrypts correctly', () => {
    const data = 'testing data'
    const password = 'a random password'
    const encryptedBuffer: Buffer = getEncryptedData(data, password)
    console.debug(`Encrypted data is ${encryptedBuffer.toString('hex')}`)
    const decryptedData: string = getDecryptedData(encryptedBuffer, password)
    console.debug(`Decrypted data is \"${decryptedData}\"`)
    expect(decryptedData).toBe(data)
  })
})
