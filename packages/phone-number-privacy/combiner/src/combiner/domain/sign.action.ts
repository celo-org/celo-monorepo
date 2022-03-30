import {
  CombinerEndpoint,
  DomainRestrictedSignatureRequest,
  getSignerEndpoint,
  SignerEndpoint,
} from '@celo/phone-number-privacy-common'
import { OdisConfig } from '../../config'
import { IOAbstract } from '../io.abstract'
import { Session } from '../session'
import { SignAbstract } from '../sign.abstract'
import { DomainStateCombinerService } from './state.service'

export class DomainSignAction extends SignAbstract<DomainRestrictedSignatureRequest> {
  readonly endpoint: CombinerEndpoint = CombinerEndpoint.DOMAIN_SIGN
  readonly signerEndpoint: SignerEndpoint = getSignerEndpoint(this.endpoint)

  constructor(
    readonly config: OdisConfig,
    readonly io: IOAbstract<DomainRestrictedSignatureRequest>,
    readonly stateCombiner: DomainStateCombinerService<DomainRestrictedSignatureRequest>
  ) {
    super(config, io)
  }

  async combine(session: Session<DomainRestrictedSignatureRequest>): Promise<void> {
    this.logResponseDiscrepancies(session)

    if (session.crypto.hasSufficientSignatures()) {
      try {
        const combinedSignature = await session.crypto.combinePartialBlindedSignatures(
          this.parseBlindedMessage(session.request.body),
          session.logger
        )
        // TODO(Alec)(Next)(responding): return other fields?
        return this.io.sendSuccess(
          200,
          session.response,
          session.logger,
          combinedSignature,
          this.stateCombiner.findThresholdDomainState(session) // TODO(Alec): naming
        )
      } catch {
        // May fail upon combining signatures if too many sigs are invalid
        // Fallback to handleMissingSignatures
      }
    }

    this.handleMissingSignatures(session)
  }

  protected parseBlindedMessage(req: DomainRestrictedSignatureRequest): string {
    return req.blindedMessage
  }

  protected logResponseDiscrepancies(_session: Session<DomainRestrictedSignatureRequest>): void {
    // TODO(Alec)
    throw new Error('Method not implemented.')
  }
}
