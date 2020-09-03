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
  errorCode: string | null
  key: () => AttestationKey
  provider: () => string | null
}

export interface AttestationKey {
  account: string
  identifier: string
  issuer: string
}

export enum AttestationStatus {
  NotSent, // Not yet received ok by a provider
  Sent, // Received ok by provider
  Queued, // Buffered or queued, but still in flight
  Upstream, // Reached upstream carrier
  Other,
  Delivered, // Success!
  Failed, // We will try to retransmit.
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
    errorCode: DataTypes.STRING,
  }) as AttestationStatic

  model.prototype.key = function(): AttestationKey {
    return { account: this.account, identifier: this.identifier, issuer: this.issuer }
  }

  model.prototype.provider = function(): string | null {
    return this.providers ? this.providers[this.attempt % this.providers.length] : null
  }

  return model
}
