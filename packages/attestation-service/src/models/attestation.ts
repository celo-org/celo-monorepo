import { E164Number } from '@celo/utils/lib/io'
import { BuildOptions, DataTypes, Model, Sequelize } from 'sequelize'

export interface AttestationModel extends Model {
  readonly id: number
  account: string
  identifier: string
  issuer: string
  countryCode: string
  phoneNumber: E164Number
  message: string
  ongoingDeliveryId: string | null
  providers: string
  attempt: number
  status: AttestationStatus
  errors: string | null
  key: () => AttestationKey
  provider: () => string | null
  recordError: (error: string) => void
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
    ongoingDeliveryId: DataTypes.STRING,
    providers: DataTypes.STRING,
    attempt: DataTypes.INTEGER,
    status: DataTypes.STRING,
    errors: DataTypes.STRING,
  }) as AttestationStatic

  model.prototype.key = function(): AttestationKey {
    return { account: this.account, identifier: this.identifier, issuer: this.issuer }
  }

  model.prototype.provider = function(): string | null {
    const pl = this.providers.split(',')
    return this.providers ? pl[this.attempt % pl.length] : null
  }

  model.prototype.recordError = function(error: string) {
    const previousErrors: any[] = this.errors ? JSON.parse(this.errors) : []
    console.log(`before ${this.errors}`)
    previousErrors.push({
      provider: this.provider(),
      attempt: this.attempt,
      error,
    })
    this.errors = JSON.stringify(previousErrors)
    console.log(`after ${this.errors}`)
  }

  return model
}
