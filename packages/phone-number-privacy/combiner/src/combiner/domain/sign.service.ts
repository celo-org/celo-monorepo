import { SignService } from '../sign.service'

export class DomainSignService extends SignService {
  protected logResponseDiscrepancies(): void {
    // TODO(Alec)
    throw new Error('Method not implemented.')
  }
}
