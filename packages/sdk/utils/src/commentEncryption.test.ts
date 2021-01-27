import { randomBytes } from 'crypto'
import { ec as EC } from 'elliptic'
import { decryptComment, encryptComment } from './commentEncryption'

const ec = new EC('secp256k1')

describe('Comment Encryption', () => {
  const self = ec.keyFromPrivate(randomBytes(32))
  const selfPublic = Buffer.from(self.getPublic('hex'), 'hex')
  const selfPriv = Buffer.from(self.getPrivate('hex'), 'hex')
  const recip = ec.keyFromPrivate(randomBytes(32))
  const recipPublic = Buffer.from(recip.getPublic('hex'), 'hex')
  const recipPriv = Buffer.from(recip.getPrivate('hex'), 'hex')
  const comment = 'text'
  const emojis = '👮‍♂️👸👱‍♀️👷‍♂️🧟‍♀️🙅‍♀️🙅‍♂️☝️👉💪🌁⛺🏭🌅🚋🦄🐇🐧🐻🐐🐓🐊🐠🐬🦅🐠🦕🐙🏵🌺🌳🍀🌻🐝🍃'

  describe('Encrypt', () => {
    it('should encrypt message without error', () => {
      const { comment: ciphertext, success } = encryptComment(comment, recipPublic, selfPublic)
      expect(ciphertext.length).toBeGreaterThan(226 + 32)
      expect(success).toBeTruthy()
    })
  })
  describe('roundtrip', () => {
    it('should return the same plaintext as sender', () => {
      const { comment: encryptedData } = encryptComment(comment, recipPublic, selfPublic)
      const { comment: plaintext, success } = decryptComment(encryptedData, selfPriv, true)
      expect(plaintext).toEqual(comment)
      expect(success).toBeTruthy()
    })
    it('should return the same plaintext as recipient', () => {
      const { comment: encryptedData } = encryptComment(comment, recipPublic, selfPublic)
      const { comment: plaintext, success } = decryptComment(encryptedData, recipPriv, false)
      expect(plaintext).toEqual(comment)
      expect(success).toBeTruthy()
    })
    it('should return the same plaintext as sender with emojis', () => {
      const { comment: encryptedData } = encryptComment(emojis, recipPublic, selfPublic)
      const { comment: plaintext, success } = decryptComment(encryptedData, selfPriv, true)
      expect(plaintext).toEqual(emojis)
      expect(success).toBeTruthy()
    })
    it('should return the same plaintext as recipient with emojis', () => {
      const { comment: encryptedData } = encryptComment(emojis, recipPublic, selfPublic)
      const { comment: plaintext, success } = decryptComment(encryptedData, recipPriv, false)
      expect(plaintext).toEqual(emojis)
      expect(success).toBeTruthy()
    })
  })
  describe('decrypt', () => {
    it('should return comment if comment is not encrypted', () => {
      const { comment: decrypted, success } = decryptComment(comment, selfPriv, true)
      expect(decrypted).toEqual(comment)
      expect(success).toBeFalsy()
    })
    it('should return comment if comment is not encrypted with emojis', () => {
      const { comment: decrypted, success } = decryptComment(emojis, selfPriv, true)
      expect(decrypted).toEqual(emojis)
      expect(success).toBeFalsy()
    })
    it('should return comment with incorrect key', () => {
      const data =
        'Ai+ACvRi7NFODDerbZzBh4i1ajm3AIUK+vRgDJQ7PRM30HyNB7OlTyZq2ZL4CpvrRk+dVS8YjiZv3lJ3qjRF64X' +
        'MeDbWtfFxbth6TidzdgosF1YiHHBhIo/IfJ8msEybA6rgY3a/S3mk/VjcvMI5T/IDG9Y+fcu3cFg3qQVGsar1sh' +
        'STap9aRwHTbRNHG6RKwKxyCFpH+rZAXhK4dZjoRIjbCNPZorcXgTO3yH2ypyOWojvOObpiJX+OuyAy/TibZcSBJ' +
        'QUCb9vxqGpV6l1ggZwgTDOnV96Q22BnSrqFr4wK63RE0jwUZqzzyAgohzk9FfyaR/0c0lwnVtl6+qIlcMlq8VPE' +
        'jT16hiaUo5lI6k851zlHIaMTe6Zr0drCJZPJRKaCjG6qpLPYCGMJRsmnbhCLIUDDBfaKbeys3dwo+05fktfoUed' +
        'vLXT+rLOvhqJR82nSOVxZSYexe4lAp6/xuFcIiDifWuJ1xiF7gti6TZ1WjXlpIswHrAQiBe5WscFhojsa56WXJ6' +
        'f1gDpxX/8hx9QhIYm2uqgbKt7d/vIFwJvo1nrrqbVRygKPHeT9Yv8GzSpYCTO8xJmlRuP+kjvrX8mXeakN2XDLT' +
        'f698dmzabQ3E2baANHIfyzzyy+onqmy05oRsGo3eFj9Xi0Fu/YME3PENyRPOYMyKT7bXEUy9nms/L9q6iuodjTJ' +
        'kn31jvRQG8s/Znw2+8a3ywkk9o5oBiK7CLitFwhrc68SaGRFwB9SmYqu+8omM+sKYxyD120iD1cUTFkQYNsPEH0' +
        'Pw9/M97SOo3Hn6QWqftiYgIksBKDhH5LMIRJbvMX6hZQjkvhbAquivjlf3Skhixsp6WC45acF+gkFZGG6w380+x' +
        'XZHcFj+EMJEW2VXtTgKe2IYOPKEb/+oYAA0+qcXmmkKRJsaHqRYVs90HCsNco='
      const { comment: decrypted, success } = decryptComment(data, selfPriv, true)
      expect(decrypted).toEqual(data)
      expect(success).toBeFalsy()
    })
  })
  describe('regression test', () => {
    const newRecipPriv = Buffer.from(
      'd2a515a64d37407f0e0e4a6a6a69a95eeb5ef8c2524ef01a6ffc6e3b39e0661b',
      'hex'
    )
    const senderPriv = Buffer.from(
      '81cb7e2e21c10862dbb3c5782fff0fe315edbd51bd9b7ffc7f1dcf4212d70537',
      'hex'
    )
    const encrypted =
      'BGacSsVDzOXrVdXBkM2yBC4F1KD94rjfClQGi7r2TPkFu+hLQIRJ73H3z5wgWVgq8vcziPR5ugWPI/6pFduezNVMAJGB9pSLfA00wvb8twy5/uBIzaAQqkfKUJ4/n10N5+F313PDq0BU1LXsPN1Oq+5SWPQc4Z4MWKs+7zkcNz//BNNZkm8lgJ4frVHExBrED62rsth87vwxpsfyxxk36zdvAHN7xfYss3bqgYVA2+E45mRZOaJxnyRHfUYKU5tA5neTertXlzpZO93l4e9SrDTUVbI/dr8QuSc2Pot7C83cCQHjeIl9eB2W5DTfTwlThg/CeWW0afaElTjuEw1XXy9eC3H9nxTXOj44SM2WUB3uDH2K2wmPJsd+RW66CDI6fD2VHMst2CA2B01hX2h+6Ml84Ria53bI6iedOpb1ejsw98a1/z2QKAlh/KfMHmseY/dQMh9kBhIuOQwavf3t4PvyMJ2QbRGwi1cuItkkyg/8eiCa8Zdjn3OozoWSQnfR'

    const newComment = 'regression test on encryption method 👍'
    // How comment was encrypted.
    // Uses elliptic package
    // console.info(
    //   encryptComment(
    //     comment,
    //     ec.keyFromPrivate(recipPriv, 'hex').getPublic(),
    //     ec.keyFromPrivate(senderPriv, 'hex').getPublic()
    //   )
    // )
    it('should not regress for sender', () => {
      const { comment: decrypted, success: didDecrypt } = decryptComment(
        encrypted,
        senderPriv,
        true
      )
      expect(decrypted).toEqual(newComment)
      expect(didDecrypt).toBeTruthy()
    })
    it('should not regress for recipeient', () => {
      const { comment: decrypted, success: didDecrypt } = decryptComment(
        encrypted,
        newRecipPriv,
        false
      )
      expect(decrypted).toEqual(newComment)
      expect(didDecrypt).toBeTruthy()
    })
  })
})
