import { hashOfClaim, KeybaseClaim } from '@celo/contractkit/lib/identity/claims/claim'
import {
  createKeybaseClaim,
  keybaseFilePathToProof,
  proofFileName,
  targetURL,
  verifyKeybaseClaim,
} from '@celo/contractkit/lib/identity/claims/keybase'
import { sleep } from '@celo/utils/lib/async'
import { flags } from '@oclif/command'
import { cli } from 'cli-ux'
import { toChecksumAddress } from 'ethereumjs-util'
import { writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { binaryPrompt } from '../../utils/cli'
import { commandExists, execCmdWithError, execWith0Exit } from '../../utils/exec'
import { ClaimCommand } from '../../utils/identity'

export default class ClaimKeybase extends ClaimCommand {
  static description = 'Claim a keybase username and add the claim to a local metadata file'
  static flags = {
    ...ClaimCommand.flags,
    username: flags.string({
      required: true,
      description: 'The keybase username you want to claim',
    }),
  }
  static args = ClaimCommand.args
  static examples = [
    'claim-keybase ~/metadata.json --from 0x47e172F6CfB6c7D01C1574fa3E2Be7CC73269D95 --username myusername',
  ]
  self = ClaimKeybase

  async run() {
    const res = this.parse(ClaimKeybase)
    const username = res.flags.username
    const metadata = await this.readMetadata()
    const accountAddress = toChecksumAddress(metadata.data.meta.address)
    const claim = createKeybaseClaim(username)
    const signature = await this.signer.sign(hashOfClaim(claim))
    await this.addClaim(metadata, claim)
    this.writeMetadata(metadata)

    try {
      await this.uploadProof(claim, signature, username, accountAddress)
    } catch (error) {
      this.printManualInstruction(claim, signature, username, accountAddress)
    }
  }

  async attemptAutomaticProofUpload(
    claim: KeybaseClaim,
    signature: string,
    username: string,
    address: string
  ) {
    const signedClaim = { claim, signature }
    try {
      cli.action.start(`Attempting to automate keybase proof`)
      const publicFolderPrefix = `/keybase/public/${username}/`
      await this.ensureKeybaseFilePathToProof(publicFolderPrefix)
      const fileName = proofFileName(address)
      const tmpPath = `${tmpdir()}/${fileName}`
      writeFileSync(tmpPath, JSON.stringify(signedClaim))
      await execCmdWithError(
        'keybase',
        ['fs', 'cp', tmpPath, publicFolderPrefix + keybaseFilePathToProof + '/' + fileName],
        { silent: true }
      )
      cli.action.stop()

      cli.action.start(`Claim successfully copied to the keybase file system, verifying proof`)
      // Wait for changes to propagate
      await sleep(3000)
      const verificationError = await verifyKeybaseClaim(this.kit, claim, address)
      if (verificationError) {
        throw new Error(`Claim is not verifiable: ${verificationError}`)
      }
      cli.action.stop()
      console.info('Claim is verifiable!')
    } catch (error) {
      cli.action.stop(`Error: ${error}`)
      throw error
    }
  }
  async uploadProof(claim: KeybaseClaim, signature: string, username: string, address: string) {
    try {
      if (
        (await commandExists('keybase')) &&
        (await binaryPrompt(
          `Found keybase CLI. Do you want me to attempt to publish the claim onto the keybase fs?`
        ))
      ) {
        await this.attemptAutomaticProofUpload(claim, signature, username, address)
      } else {
        this.printManualInstruction(claim, signature, username, address)
      }
    } catch (error) {
      cli.action.stop('Error')
      console.error(
        'Could not automatically finish the proving, please complete this step manually.\n\n ' +
          error
      )
      this.printManualInstruction(claim, signature, username, address)
    }
  }

  printManualInstruction(
    claim: KeybaseClaim,
    signature: string,
    username: string,
    address: string
  ) {
    const fileName = proofFileName(address)
    writeFileSync(fileName, JSON.stringify({ claim, signature }))
    console.info(
      `\nProving a keybase claim requires you to publish the signed claim on your Keybase file system to prove ownership. We saved it for you under ${fileName}. It should be hosted in your public folder at ${keybaseFilePathToProof}/${fileName}, so that it is available under ${targetURL(
        username,
        address
      )}\n`
    )
  }

  async ensureKeybaseFilePathToProof(base: string) {
    const segments = keybaseFilePathToProof.split('/')
    let currentPath = base
    for (let i = 0; i < segments.length - 1; i++) {
      currentPath += segments[i] + '/'
      if (!(await execWith0Exit('keybase', ['fs', 'ls', currentPath], { silent: true }))) {
        await execCmdWithError('keybase', ['fs', 'mkdir', currentPath], { silent: true })
      }
    }
  }
}
