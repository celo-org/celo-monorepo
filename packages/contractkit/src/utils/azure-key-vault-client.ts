import { DefaultAzureCredential } from '@azure/identity'
import { CryptographyClient, KeyClient, KeyVaultKey } from '@azure/keyvault-keys'
import { SecretClient } from '@azure/keyvault-secrets'
import { BigNumber } from 'bignumber.js'
import { bigNumberToBuffer, bufferToBigNumber, makeCanonical, Signature } from './signature-utils'
import { publicKeyPrefix, recoverKeyIndex, sixtyFour, thirtyTwo } from './signing-utils'

export enum AzureKeyVaultSigningAlgorithm {
  ECDSA256 = 'ECDSA256',
  ES256K = 'ES256K',
}

const DEFAULT_SIGNING_ALGORITHM = AzureKeyVaultSigningAlgorithm.ECDSA256

/**
 * Provides an abstraction on Azure Key Vault for performing signing operations
 */
export class AzureKeyVaultClient {
  private readonly vaultName: string
  // Unique URI of the Azure Key Vault
  private readonly vaultUri: string
  private readonly credential: DefaultAzureCredential
  private readonly keyClient: KeyClient
  private readonly SIGNING_ALGORITHM: AzureKeyVaultSigningAlgorithm
  private cryptographyClientSet: Map<string, CryptographyClient> = new Map<
    string,
    CryptographyClient
  >()
  private readonly secretClient: SecretClient

  constructor(vaultName: string, signingAlgorithm?: AzureKeyVaultSigningAlgorithm) {
    this.vaultName = vaultName
    this.vaultUri = `https://${this.vaultName}.vault.azure.net`
    // DefaultAzureCredential supports service principal or managed identity
    // If using a service principal, you must set the appropriate environment vars
    this.credential = new DefaultAzureCredential()
    this.keyClient = new KeyClient(this.vaultUri, this.credential)
    this.secretClient = new SecretClient(this.vaultUri, this.credential)
    this.SIGNING_ALGORITHM = signingAlgorithm || DEFAULT_SIGNING_ALGORITHM
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

    const pubKeyPrefix = Buffer.from(new Uint8Array([publicKeyPrefix]))
    const rawPublicKey = Buffer.concat([
      pubKeyPrefix,
      Buffer.from(signingKey.key!.x!),
      Buffer.from(signingKey.key!.y!),
    ])
    const publicKey = bufferToBigNumber(rawPublicKey)
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
    const signResult = await cryptographyClient.sign(
      // @ts-ignore-next-line (ECDSA256 is not included in the client enum but is valid)
      this.SIGNING_ALGORITHM,
      new Uint8Array(message)
    )
    // The output of this will be a 64 byte array.
    // The first 32 are the value for R and the rest is S
    if (
      typeof signResult === 'undefined' ||
      typeof signResult.result === 'undefined' ||
      signResult.result.length !== sixtyFour
    ) {
      throw new Error(`Invalid signature returned from Azure: ${signResult}`)
    }
    const rawSignature = signResult.result

    // Canonicalize signature
    const R = bufferToBigNumber(Buffer.from(rawSignature.slice(0, thirtyTwo)))
    let S = bufferToBigNumber(Buffer.from(rawSignature.slice(thirtyTwo, sixtyFour)))
    S = makeCanonical(S)

    const rBuff = bigNumberToBuffer(R, thirtyTwo)
    const sBuff = bigNumberToBuffer(S, thirtyTwo)
    const canonicalizedSignature = Buffer.concat([rBuff, sBuff])
    const publicKey = await this.getPublicKey(keyName)

    // Azure doesn't provide the recovery key in the signature
    const recoveryParam = recoverKeyIndex(canonicalizedSignature, publicKey, message)
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
