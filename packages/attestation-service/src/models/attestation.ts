import { BuildOptions, DataTypes, Model, Sequelize } from 'sequelize'

interface AttestationModel extends Model {
  readonly id: number
  account: string
  phoneNumber: string
  issuer: string
}

export type AttestationStatic = typeof Model &
  (new (values?: object, options?: BuildOptions) => AttestationModel)

export default (sequelize: Sequelize) =>
  sequelize.define('Attestations', {
    account: DataTypes.STRING,
    phoneNumber: DataTypes.STRING,
    issuer: DataTypes.STRING,
  }) as AttestationStatic
