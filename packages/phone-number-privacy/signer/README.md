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

Currently, the service only supports a key maintained in Azure Key Vault (AKV).  You can set the following environment variables to configure the AKV connection.  These values are generated when creating a service principal account (see [Configuring your Key Vault](https://www.npmjs.com/package/@azure/keyvault-keys#configuring-your-key-vault))

- `KEYVAULT_AZURE_CLIENT_ID` - The clientId of the service principal account that has [Get, List] access to secrets.
- `KEYVAULT_AZURE_CLIENT_SECRET` - The client Secret of the same service principal account.
- `KEYVAULT_AZURE_TENANT` - The tenant that the service principal is a member of.
- `KEYVAULT_AZURE_VAULT_NAME` - The name of your Azure Key Vault.
- `KEYVAULT_AZURE_SECRET_NAME` - The name of the secret that holds your BLS key.

## Operations

- `yarn db:migrate` - run to migrate the DB tables.
- `yarn start` - run to start the service

Error logs will be prefixed with `CELO_PNP_ERROR_XX`.  You can see a full list of them in [error.utils.ts](https://github.com/celo-org/celo-monorepo/blob/master/packages/phone-number-privacy/signer/src/common/error-utils.ts).