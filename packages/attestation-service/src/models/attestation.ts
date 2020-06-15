import { BuildOptions, DataTypes, Model, Sequelize } from 'sequelize'
import { SmsProviderType } from '../sms/base'

export interface AttestationModel extends Model {
  readonly id: number
  account: string
  identifier: string
  issuer: string
  status: AttestationStatus
  smsProvider: SmsProviderType

  canSendSms: () => boolean
}

export enum AttestationStatus {
  DISPATCHING = 'DISPATCHING',
  UNABLE_TO_SERVE = 'UNABLE_TO_SERVE',
  FAILED = 'FAILED',
  SENT = 'SMS_SEND_SUCCESS',
  COMPLETE = 'COMPLETE',
}

export type AttestationStatic = typeof Model &
  (new (values?: object, options?: BuildOptions) => AttestationModel)

export default (sequelize: Sequelize) => {
  const model = sequelize.define('Attestations', {
    account: DataTypes.STRING,
    identifier: DataTypes.STRING,
    issuer: DataTypes.STRING,
    status: DataTypes.STRING,
    smsProvider: DataTypes.STRING,
  }) as AttestationStatic

  model.prototype.canSendSms = function() {
    return [
      AttestationStatus.DISPATCHING,
      AttestationStatus.FAILED,
      AttestationStatus.UNABLE_TO_SERVE,
    ].includes(this.status)
  }

  return model
}
