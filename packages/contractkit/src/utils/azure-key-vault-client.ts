import { DefaultAzureCredential } from '@azure/identity'
import { CryptographyClient, KeyClient, KeyVaultKey } from '@azure/keyvault-keys'
import { SecretClient } from '@azure/keyvault-secrets'
import { ensureLeading0x } from '@celo/utils/lib/address'
import { BigNumber } from 'bignumber.js'
import debugFactory from 'debug'
import { ec as EC } from 'elliptic'
import * as ethUtil from 'ethereumjs-util'
import { ecdsaRecover } from 'secp256k1'

const debug = debugFactory('kit:wallet:akv-client')

/**
 * Provides an abstraction on Azure Key Vault for performing signing operations
 */
export class AzureKeyVaultClient {
  private readonly vaultName: string
  // Unique URI of the Azure Key Vault
  private readonly vaultUri: string
  private readonly credential: DefaultAzureCredential
  private readonly keyClient: KeyClient
  private readonly SIGNING_ALGORITHM: string = 'ECDSA256'

  // 0x04 prefix indicates that the key is not compressed
  // https://tools.ietf.org/html/rfc5480#section-2.2
  private readonly publicKeyPrefix: number = 0x04
  private readonly secp256k1Curve = new EC('secp256k1')
  private cryptographyClientSet: Map<string, CryptographyClient> = new Map<
    string,
    CryptographyClient
  >()
  private readonly secretClient: SecretClient

  constructor(vaultName: string) {
    this.vaultName = vaultName
    this.vaultUri = `https://${this.vaultName}.vault.azure.net`
    // DefaultAzureCredential supports service principal or managed identity
    // If using a service principal, you must set the appropriate environment vars
    this.credential = new DefaultAzureCredential()
    this.keyClient = new KeyClient(this.vaultUri, this.credential)
    this.secretClient = new SecretClient(this.vaultUri, this.credential)
  }

  public async getKeys(): Promise<string[]> {
    const keyNames = new Array<string>()
    for await (const keyProperties of this.keyClient.listPropertiesOfKeys()) {
      keyNames.push(keyProperties.name)
    }
    return keyNames
  }

  public async getPublicKey(keyName: string): Promise<BigNumber> {
    const signingKey = await this.getKey(keyName)

    const pubKeyPrefix = Buffer.from(new Uint8Array([this.publicKeyPrefix]))
    const rawPublicKey = Buffer.concat([
      pubKeyPrefix,
      Buffer.from(signingKey.key!.x!),
      Buffer.from(signingKey.key!.y!),
    ])
    const publicKey = AzureKeyVaultClient.bufferToBigNumber(rawPublicKey)
    return publicKey
  }

  public async getKeyId(keyName: string): Promise<string> {
    if (!(await this.hasKey(keyName))) {
      throw new Error(`Unable to locate key: ${keyName}`)
    }
    return (await this.getKey(keyName)).id!
  }

  public async signMessage(message: Buffer, keyName: string): Promise<Signature> {
    if (!(await this.hasKey(keyName))) {
      throw new Error(`Unable to locate key: ${keyName}`)
    }
    const cryptographyClient = await this.getCryptographyClient(keyName)
    // @ts-ignore-next-line (ECDSA256 is not included in the client enum but is valid)
    const signResult = await cryptographyClient.sign(this.SIGNING_ALGORITHM, message)
    // The output of this will be a 64 byte array.
    // The first 32 are the value for R and the rest is S
    if (
      typeof signResult === 'undefined' ||
      typeof signResult.result === 'undefined' ||
      signResult.result.length !== 64
    ) {
      throw new Error(`Invalid signature returned from Azure: ${signResult}`)
    }
    const rawSignature = signResult.result

    // Canonicalize signature
    const R = AzureKeyVaultClient.bufferToBigNumber(Buffer.from(rawSignature.slice(0, 32)))
    let S = AzureKeyVaultClient.bufferToBigNumber(Buffer.from(rawSignature.slice(32, 64)))

    // The Azure Signature MAY not be canonical, which is illegal in Ethereum
    // thus it must be transposed to the lower intersection.
    // https://github.com/bitcoin/bips/blob/master/bip-0062.mediawiki#Low_S_values_in_signatures
    const N = AzureKeyVaultClient.bufferToBigNumber(this.secp256k1Curve.curve.n)
    if (!AzureKeyVaultClient.isCanonical(S, N)) {
      debug('Canonicalizing signature')
      S = N.minus(S)
    }

    const rBuff = AzureKeyVaultClient.bigNumberToBuffer(R)
    const sBuff = AzureKeyVaultClient.bigNumberToBuffer(S)
    const canonicalizedSignature = Buffer.concat([rBuff, sBuff])
    const publicKey = await this.getPublicKey(keyName)

    // Azure doesn't provide the recovery key in the signature
    const recoveryParam = AzureKeyVaultClient.recoverKeyIndex(
      canonicalizedSignature,
      publicKey,
      message
    )
    return new Signature(recoveryParam, rBuff, sBuff)
  }

  public async hasKey(keyName: string): Promise<boolean> {
    try {
      await this.keyClient.getKey(keyName)
    } catch (e) {
      if (e.message.includes('this is not a valid private key')) {
        return false
      }
      throw e
    }
    return true
  }

  public async getSecret(secretName: string): Promise<string> {
    const secret = await this.secretClient.getSecret(secretName)
    if (!secret.value) {
      throw new Error(`Could not locate secret ${secretName} in vault ${this.vaultName}`)
    }
    return secret.value
  }

  /**
   * Returns true if the signature is in the "bottom" of the curve
   */
  private static isCanonical(S: BigNumber, curveN: BigNumber): boolean {
    return S.comparedTo(curveN.dividedBy(2)) <= 0
  }

  /**
   * Attempts each recovery key to find a match
   */
  private static recoverKeyIndex(
    signature: Uint8Array,
    publicKey: BigNumber,
    hash: Uint8Array
  ): number {
    for (let i = 0; i < 4; i++) {
      const compressed = false
      try {
        const recoveredPublicKeyByteArr = ecdsaRecover(signature, i, hash, compressed)
        const publicKeyBuff = Buffer.from(recoveredPublicKeyByteArr)
        const recoveredPublicKey = AzureKeyVaultClient.bufferToBigNumber(publicKeyBuff)
        debug('Recovered key: ' + recoveredPublicKey)
        if (publicKey.eq(recoveredPublicKey)) {
          return i
        }
      } catch (e) {
        if (e.message === 'Public key could not be recover') {
          throw new Error('Invalid public key. Ensure that the key type is ECDSA')
        }
      }
    }
    throw new Error('Unable to generate recovery key from signature.')
  }

  private async getKey(keyName: string): Promise<KeyVaultKey> {
    try {
      const signingKey = await this.keyClient.getKey(keyName)

      if (
        typeof signingKey?.id === 'undefined' ||
        typeof signingKey?.key?.x === 'undefined' ||
        typeof signingKey?.key?.y === 'undefined'
      ) {
        throw new Error(`Invalid key data returned from Azure: ${signingKey}`)
      }

      return signingKey
    } catch (e) {
      if (e.message.includes('Key not found')) {
        throw new Error(`Key ${keyName} not found in KeyVault ${this.vaultName}`)
      }
      throw new Error(`Unexpected KeyVault error ${e.message}`)
    }
  }

  private static bufferToBigNumber(input: Buffer): BigNumber {
    return new BigNumber(ensureLeading0x(input.toString('hex')))
  }
  private static bigNumberToBuffer(input: BigNumber): Buffer {
    return ethUtil.toBuffer(ensureLeading0x(input.toString(16))) as Buffer
  }

  /**
   * Provides the CryptographyClient for the requested key
   * Creates a new client if it doesn't already exist
   */
  private async getCryptographyClient(keyName: string): Promise<CryptographyClient> {
    if (!this.cryptographyClientSet.has(keyName)) {
      const keyId = await this.getKeyId(keyName)
      this.cryptographyClientSet.set(keyName, new CryptographyClient(keyId, this.credential))
    }

    return this.cryptographyClientSet.get(keyName)!
  }
}

export class Signature {
  public v: number
  public r: Buffer
  public s: Buffer

  constructor(v: number, r: Buffer, s: Buffer) {
    this.v = v
    this.r = r
    this.s = s
  }
}
