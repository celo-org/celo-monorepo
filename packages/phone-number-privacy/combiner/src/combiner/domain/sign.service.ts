import {
  CombinerEndpoint,
  DomainRestrictedSignatureResponse,
  getSignerEndpoint,
  SignerEndpoint,
} from '@celo/phone-number-privacy-common'
import { OdisConfig } from '../../config'
import { SignerResponseWithStatus } from '../combiner.service'
import { ICombinerInputService } from '../input.interface'
import { SignService } from '../sign.service'

interface DomainSignResponseWithStatus extends SignerResponseWithStatus {
  url: string
  res: DomainRestrictedSignatureResponse
  status: number
}

export class DomainSignService extends SignService {
  protected endpoint: CombinerEndpoint
  protected signerEndpoint: SignerEndpoint
  protected responses: DomainSignResponseWithStatus[]

  public constructor(
    _config: OdisConfig,
    protected inputService: ICombinerInputService,
    protected blindedMessage: string
  ) {
    super(_config, inputService, blindedMessage)
    this.endpoint = CombinerEndpoint.DOMAIN_SIGN
    this.signerEndpoint = getSignerEndpoint(this.endpoint)
    this.responses = []
  }

  protected parseSignature(
    res: DomainRestrictedSignatureResponse,
    signerUrl: string
  ): string | undefined {
    if (!res.success) {
      this.logger.error(
        {
          error: res.error,
          signer: signerUrl,
        },
        'Signer responded with error'
      )
      return undefined
    }
    return res.signature
  }

  protected logResponseDiscrepancies(): void {
    // TODO(Alec)(Next)
    throw new Error('Method not implemented.')
  }
}
