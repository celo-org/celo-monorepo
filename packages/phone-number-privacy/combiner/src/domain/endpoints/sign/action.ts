import {
  CombinerEndpoint,
  DomainRestrictedSignatureRequest,
  getSignerEndpoint,
  SignerEndpoint,
} from '@celo/phone-number-privacy-common'
import { IO } from '../../../common/io'
import { Session } from '../../../common/session'
import { SignAction } from '../../../common/sign'
import { OdisConfig } from '../../../config'
import { DomainThresholdStateService } from '../../services/thresholdState'

export class DomainSignAction extends SignAction<DomainRestrictedSignatureRequest> {
  readonly endpoint: CombinerEndpoint = CombinerEndpoint.DOMAIN_SIGN
  readonly signerEndpoint: SignerEndpoint = getSignerEndpoint(this.endpoint)

  constructor(
    readonly config: OdisConfig,
    readonly thresholdStateService: DomainThresholdStateService<DomainRestrictedSignatureRequest>,
    readonly io: IO<DomainRestrictedSignatureRequest>
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
        return this.io.sendSuccess(
          200,
          session.response,
          session.logger,
          combinedSignature,
          this.thresholdStateService.findThresholdDomainState(session)
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
    // TODO
    throw new Error('Method not implemented.')
  }
}
