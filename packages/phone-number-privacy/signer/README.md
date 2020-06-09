# Phone Number Privacy - Signer Service

A service run by distributed partners that generates unique partial signatures for phone number salts. Using a threshold BLS signature scheme, when K/N signatures are combined, a deterministic signature is obtained.

## Configuration

You can use the following environment variables to configure the Phone Number Privacy - Signer service:

- `NODE_ENV` - eg. development, production
- `SERVER_PORT` - The port on which the express node app runs.
- `BLOCKCHAIN_PROVIDER` - The blockchain node provider for on chain requests. This could be a node with RPC set up.  For development testing you can use https://alfajores-forno.celo-testnet.org
- `DB_HOST` - The URL under which your database is accessible.  Supports Postgres, MSSQL, MySQL, MariaDB, SQLite3, Oracle.
- `DB_USERNAME` - DB configuration: The DB username.
- `DB_PASSWORD` - DB configuration: The DB password.
- `DB_DATABASE` DB configuration: The DB database name.

Currently, the service only supports a key maintained in Azure Key Vault (AKV).  You can set the following environment variables to configure the AKV connection.

- `KEYVAULT_AZURE_CLIENT_ID` - Azure KeyVault configuration: Client id.
- `KEYVAULT_AZURE_CLIENT_SECRET` - Azure KeyVault configuration: Client secret.
- `KEYVAULT_AZURE_TENANT` - Azure KeyVault configuration: Tenant.
- `KEYVAULT_AZURE_VAULT_NAME` - Azure KeyVault configuration: Vault name.
- `KEYVAULT_AZURE_SECRET_NAME` - Azure KeyVault configuration: Secret name.

## Operations

- `yarn db:migrate` - run to migrate the DB tables.
- `yarn start` - run to start the service

Logs will be prefixed with `CELO_PNP_ERROR_XX`.  You can see a full list of them in [error.utils.ts](https://github.com/celo-org/celo-monorepo/blob/master/packages/phone-number-privacy/signer/src/common/error-utils.ts).