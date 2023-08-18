import {
  Domain,
  domainHash,
  DomainRestrictedSignatureRequest,
  domainRestrictedSignatureRequestSchema,
  DomainSchema,
  ErrorType,
  getRequestKeyVersion,
  KEY_VERSION_HEADER,
  requestHasValidKeyVersion,
  ThresholdPoprfServer,
  verifyDomainRestrictedSignatureRequestAuthenticity,
  WarningMessage,
} from '@celo/phone-number-privacy-common'
import { EIP712Optional } from '@celo/utils/lib/sign-typed-data-utils'
import Logger from 'bunyan'
import { Request } from 'express'
import { Knex } from 'knex'
import {
  DomainStateRecord,
  toSequentialDelayDomainState,
} from '../../../common/database/models/domain-state'
import { errorResult, ResultHandler } from '../../../common/handler'
import { DefaultKeyName, Key, KeyProvider } from '../../../common/key-management/key-provider-base'
import { OdisQuotaStatusResult } from '../../../common/quota'
import { getSignerVersion, SignerConfig } from '../../../config'
import { DomainQuotaService } from '../../services/quota'

type TrxResult =
  | {
      success: false
      status: number
      domainStateRecord: DomainStateRecord
      error: ErrorType
    }
  | {
      success: true
      status: number
      domainStateRecord: DomainStateRecord
      key: Key
      signature: string
    }

export function domainSign(
  db: Knex,
  config: SignerConfig,
  quota: DomainQuotaService,
  keyProvider: KeyProvider
): ResultHandler<DomainRestrictedSignatureRequest> {
  return async (request, response) => {
    const { logger } = response.locals

    if (!isValidRequest(request)) {
      return errorResult(400, WarningMessage.INVALID_INPUT)
    }
    if (!requestHasValidKeyVersion(request, logger)) {
      return errorResult(400, WarningMessage.INVALID_KEY_VERSION_REQUEST)
    }
    if (!verifyDomainRestrictedSignatureRequestAuthenticity(request.body)) {
      return errorResult(401, WarningMessage.UNAUTHENTICATED_USER)
    }

    const { domain } = request.body

    logger.info(
      {
        name: domain.name,
        version: domain.version,
        hash: domainHash(domain).toString('hex'),
      },
      'Processing request to get domain signature '
    )
    const res: TrxResult = await db.transaction(async (trx) => {
      // Get the current domain state record, or use an empty record if one does not exist.
      const domainStateRecord: DomainStateRecord = await quota.getQuotaStatus(domain, logger, trx)

      // Note that this action occurs in the same transaction as the remainder of the siging
      // action. As a result, this is included here rather than in the authentication function.
      if (!nonceCheck(domainStateRecord, request.body, logger)) {
        return {
          // TODO revisit this
          success: false,
          status: 401,
          domainStateRecord,
          error: WarningMessage.INVALID_NONCE,
        }
      }

      const quotaStatus: OdisQuotaStatusResult<DomainRestrictedSignatureRequest> =
        await quota.checkAndUpdateQuotaStatus(
          // TODO types
          domainStateRecord,
          request.body.domain,
          trx,
          logger
        )

      if (!quotaStatus.sufficient) {
        logger.warn(
          {
            name: domain.name,
            version: domain.version,
            hash: domainHash(domain),
          },
          `Exceeded quota`
        )
        return {
          success: false,
          status: 429,
          domainStateRecord: quotaStatus.state,
          error: WarningMessage.EXCEEDED_QUOTA,
        }
      }

      const key: Key = {
        version: getRequestKeyVersion(request, logger) ?? config.keystore.keys.domains.latest,
        name: DefaultKeyName.DOMAINS,
      }

      // Compute evaluation inside transaction so it will rollback on error.
      const evaluation: Buffer = await sign(
        domain,
        request.body.blindedMessage,
        key,
        logger,
        keyProvider
      )

      return {
        success: true,
        status: 200,
        domainStateRecord: quotaStatus.state,
        key,
        signature: evaluation.toString('base64'),
      }
    })

    if (res.success) {
      response.set(KEY_VERSION_HEADER, res.key.version.toString())
      return {
        status: 200,
        body: {
          success: true,
          version: getSignerVersion(),
          signature: res.signature,
          status: toSequentialDelayDomainState(res.domainStateRecord),
        },
      }
    } else {
      return errorResult(res.status, res.error, {
        status: toSequentialDelayDomainState(res.domainStateRecord),
      })
    }
  }
}

function isValidRequest(
  request: Request<{}, {}, unknown>
): request is Request<{}, {}, DomainRestrictedSignatureRequest> {
  return domainRestrictedSignatureRequestSchema(DomainSchema).is(request.body)
}

function nonceCheck(
  domainStateRecord: DomainStateRecord,
  body: DomainRestrictedSignatureRequest,
  logger: Logger
): boolean {
  const nonce: EIP712Optional<number> = body.options.nonce
  if (!nonce.defined) {
    logger.info('Nonce is undefined')
    return false
  }
  return nonce.value >= domainStateRecord.counter
}

async function sign(
  domain: Domain,
  blindedMessage: string,
  key: Key,
  logger: Logger,
  keyProvider: KeyProvider
): Promise<Buffer> {
  let privateKey: string
  try {
    privateKey = await keyProvider.getPrivateKeyOrFetchFromStore(key)
  } catch (err) {
    logger.error({ key }, 'Requested key version not supported')
    logger.error(err)
    throw new Error(WarningMessage.INVALID_KEY_VERSION_REQUEST)
  }

  const server = new ThresholdPoprfServer(Buffer.from(privateKey, 'hex'))
  return server.blindPartialEval(domainHash(domain), Buffer.from(blindedMessage, 'base64'))
}
