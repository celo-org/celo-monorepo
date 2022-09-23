import { Knex } from 'knex'
import { REQUESTS_TABLE_LEGACY } from '../../../common/database/models/request'
import { KeyProvider } from '../../../common/key-management/key-provider-base'
import { SignerConfig } from '../../../config'
import { PnpQuotaService } from '../../services/quota'
import { PnpSignAction } from './action'
import { LegacyPnpSignIO } from './io.legacy'

export class LegacyPnpSignAction extends PnpSignAction {
  constructor(
    readonly db: Knex,
    readonly config: SignerConfig,
    readonly quota: PnpQuotaService,
    readonly keyProvider: KeyProvider,
    readonly io: LegacyPnpSignIO
  ) {
    super(db, config, quota, keyProvider, io)
  }

  protected readonly requestsTable = REQUESTS_TABLE_LEGACY
}
