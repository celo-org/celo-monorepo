import { E164Number } from '@celo/phone-utils/lib/io'
import { BuildOptions, DataTypes, Model, Sequelize } from 'sequelize'

// Split out SmsFields from the underlying data model;
// Contains fields relevant to the message itself, not to meta-info
// about how/when the message was sent.
export interface SmsFields {
  account: string
  identifier: string
  issuer: string
  countryCode: string
  phoneNumber: E164Number
  message: string
  securityCode: string | null
  attestationCode: string | null
  appSignature: string | undefined
  language: string | undefined
}

export interface AttestationModel extends Model, SmsFields {
  readonly id: number
  securityCodeAttempt: number
  ongoingDeliveryId: string | null
  providers: string
  attempt: number
  status: AttestationStatus
  errors: string | null
  createdAt: Date
  completedAt: Date | null
  key: () => AttestationKey
  provider: () => string | null
  recordError: (error: string) => void
  failure: () => boolean
  currentError: () => string | undefined
}

export interface AttestationKey {
  account: string
  identifier: string
  issuer: string
}

// Attestations only transition from lower to higher
export enum AttestationStatus {
  NotSent, // Not yet received ok by a provider
  Sent, // Received ok by provider
  Queued, // Buffered or queued, but still in flight
  Upstream, // Reached upstream carrier
  Other,
  Failed, // We will try to retransmit.
  Delivered, // Success!
}

export type AttestationStatic = typeof Model &
  (new (values?: object, options?: BuildOptions) => AttestationModel)

export default (sequelize: Sequelize) => {
  const model = sequelize.define('Attestations', {
    account: DataTypes.STRING,
    identifier: DataTypes.STRING,
    issuer: DataTypes.STRING,
    countryCode: DataTypes.STRING,
    phoneNumber: DataTypes.STRING,
    message: DataTypes.STRING,
    securityCode: DataTypes.STRING,
    securityCodeAttempt: DataTypes.INTEGER,
    attestationCode: DataTypes.STRING,
    ongoingDeliveryId: DataTypes.STRING,
    providers: DataTypes.STRING,
    attempt: DataTypes.INTEGER,
    status: DataTypes.STRING,
    errors: DataTypes.STRING,
    createdAt: DataTypes.DATE,
    completedAt: DataTypes.DATE,
    appSignature: DataTypes.STRING,
    language: DataTypes.STRING,
  }) as AttestationStatic

  model.prototype.key = function (): AttestationKey {
    return { account: this.account, identifier: this.identifier, issuer: this.issuer }
  }

  model.prototype.provider = function (): string | null {
    const pl = this.providers.split(',')
    return this.providers ? pl[this.attempt % pl.length] : null
  }

  model.prototype.recordError = function (error: string) {
    const errors = this.errors ? JSON.parse(this.errors) : {}

    errors[this.attempt] = {
      provider: this.provider(),
      error,
    }
    this.errors = JSON.stringify(errors)
  }

  model.prototype.failure = function (): boolean {
    return (
      // tslint:disable-next-line: triple-equals
      this.status == AttestationStatus.NotSent.valueOf() ||
      // tslint:disable-next-line: triple-equals
      this.status == AttestationStatus.Failed.valueOf()
    )
  }

  model.prototype.currentError = function () {
    if (this.failure()) {
      const errors = this.errors ? JSON.parse(this.errors) : {}
      return errors[this.attempt]?.error ?? errors[this.attempt - 1]?.error ?? undefined
    } else {
      return undefined
    }
  }

  return model
}
