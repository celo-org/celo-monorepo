import { flags } from '@oclif/command'
import { ReleaseGoldBaseCommand } from '../../release-gold-base'
import { newCheckBuilder } from '../../utils/checks'
import { displaySendTx } from '../../utils/cli'
import { Flags } from '../../utils/command'

export default class Authorize extends ReleaseGoldBaseCommand {
  static description =
    'Authorize an alternative key to be used for a given action (Vote, Validate, Attest) on behalf of the ReleaseGold instance contract.'

  static flags = {
    ...ReleaseGoldBaseCommand.flags,
    role: flags.string({ required: true, options: ['vote', 'validator', 'attestation'] }),
    signer: Flags.address({
      required: true,
      description: 'The signer key that is to be used for voting through the ReleaseGold instance',
    }),
    signature: Flags.proofOfPossession({
      description: 'Signature (a.k.a. proof-of-possession) of the signer key',
      required: true,
    }),
    blsKey: Flags.blsPublicKey({
      description:
        'The BLS public key that the validator is using for consensus, should pass proof of possession. 96 bytes.',
      dependsOn: ['blsPop'],
    }),
    blsPop: Flags.blsProofOfPossession({
      description:
        'The BLS public key proof-of-possession, which consists of a signature on the account address. 48 bytes.',
      dependsOn: ['blsKey'],
    }),
    force: flags.boolean({
      description:
        'Allow rotation of validator ECDSA key without rotating the BLS key. Only intended for validators with a special reason to do so.',
      default: false,
      hidden: true,
    }),
  }

  static args = []

  static examples = [
    'authorize --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631 --role vote --signer 0x6ecbe1db9ef729cbe972c83fb886247691fb6beb --signature 0x1b9fca4bbb5bfb1dbe69ef1cddbd9b4202dcb6b134c5170611e1e36ecfa468d7b46c85328d504934fce6c2a1571603a50ae224d2b32685e84d4d1a1eebad8452eb',
    'authorize --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631 --role validator --signer 0x6ecbe1db9ef729cbe972c83fb886247691fb6beb --signature 0x1b9fca4bbb5bfb1dbe69ef1cddbd9b4202dcb6b134c5170611e1e36ecfa468d7b46c85328d504934fce6c2a1571603a50ae224d2b32685e84d4d1a1eebad8452eb',
    'authorize --contract 0x5409ED021D9299bf6814279A6A1411A7e866A631 --role attestation --signer 0x6ecbe1db9ef729cbe972c83fb886247691fb6beb --signature 0x1b9fca4bbb5bfb1dbe69ef1cddbd9b4202dcb6b134c5170611e1e36ecfa468d7b46c85328d504934fce6c2a1571603a50ae224d2b32685e84d4d1a1eebad8452eb',
  ]

  async run() {
    // tslint:disable-next-line
    const { flags } = this.parse(Authorize)
    const role = flags.role

    // Check that the account is registered on-chain.
    // Additionally, if the authorization is for a validator, the BLS key must be provided when the
    // validator is already registered, and cannot be provided if the validator is not registered.
    // (Because the BLS key is stored on the validator entry, which would not exist yet)
    // Using the --force flag allows setting the ECDSA key on the validator without the BLS key.
    const checker = newCheckBuilder(this).isAccount(this.releaseGoldWrapper.address)
    if (flags.role === 'validator' && !flags.force) {
      if (flags.blsKey && flags.blsPop) {
        checker.isValidator(this.releaseGoldWrapper.address)
      } else {
        checker.isNotValidator(this.releaseGoldWrapper.address)
      }
    }
    await checker.runChecks()

    const accounts = await this.kit.contracts.getAccounts()
    const sig = accounts.parseSignatureOfAddress(
      this.releaseGoldWrapper.address,
      flags.signer,
      flags.signature
    )

    const isRevoked = await this.releaseGoldWrapper.isRevoked()
    this.kit.defaultAccount = isRevoked
      ? await this.releaseGoldWrapper.getReleaseOwner()
      : await this.releaseGoldWrapper.getBeneficiary()
    let tx: any
    if (role === 'vote') {
      tx = await this.releaseGoldWrapper.authorizeVoteSigner(flags.signer, sig)
    } else if (role === 'validator' && flags.blsKey && flags.blsPop) {
      tx = await this.releaseGoldWrapper.authorizeValidatorSignerAndBls(
        flags.signer,
        sig,
        flags.blsKey,
        flags.blsPop
      )
    } else if (role === 'validator') {
      tx = await this.releaseGoldWrapper.authorizeValidatorSigner(flags.signer, sig)
    } else if (role === 'attestation') {
      tx = await this.releaseGoldWrapper.authorizeAttestationSigner(flags.signer, sig)
    } else {
      this.error('Invalid role provided')
      return
    }
    await displaySendTx('authorize' + role + 'Tx', tx)
  }
}
