import { BuildOptions, DataTypes, Model, Sequelize } from 'sequelize'

export interface VerifiableCredentialModel extends Model {
  readonly id?: number
  '@context': Array<string>
  type: Array<string>
  credentialSubject: any
  issuer: string
  issuanceDate: string // RFC 3339 -> Date().toISOString()
  proof: string
  expirationDate?: string // RFC 3339 -> Date().toISOString()
  failure: () => boolean
  errors: () => Array<string>
}

export type VerifiableCredentialStatic = typeof Model &
  (new (values?: object, options?: BuildOptions) => VerifiableCredentialModel)

export default (sequelize: Sequelize) => {
  const model = sequelize.define('VerifiableCredential', {
    '@context': DataTypes.ARRAY,
    type: DataTypes.ARRAY,
    credentialSubject: DataTypes.JSON,
    issuer: DataTypes.STRING,
    issuanceDate: DataTypes.STRING, // RFC 3339 -> Date().toISOString()
    proof: DataTypes.STRING,
    expirationDate: DataTypes.STRING, // RFC 3339 -> Date().toISOString()
  }) as VerifiableCredentialStatic

  return model
}
