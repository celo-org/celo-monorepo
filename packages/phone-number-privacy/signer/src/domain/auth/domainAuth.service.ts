import { IDomainAuthService } from './domainAuth.interface'

export class DomainAuthService implements IDomainAuthService {
  // TODO real impl
  public authCheck(): boolean {
    return true
  }
}
