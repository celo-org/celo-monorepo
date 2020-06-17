# Phone Number Privacy - Signer Service

A service run by distributed partners that generates unique partial signatures for phone number salts. Using a threshold BLS signature scheme, when K/N signatures are combined, a deterministic signature is obtained.

## Configuration

You can use the following environment variables to configure the Phone Number Privacy - Signer service:

- `NODE_ENV` - `development` or `production`
- `SERVER_PORT` - The port on which the express node app runs (8080 by default).
- `DB_HOST` - The URL under which your database is accessible. Supports Postgres, MSSQL, MySQL, MariaDB, SQLite3, Oracle.
- `DB_USERNAME` - DB configuration: The DB username (postgres by default).
- `DB_PASSWORD` - DB configuration: The DB password.
- `DB_DATABASE` DB configuration: The DB database name (phoneNumberPrivacy by default).

### Blockchain provider

The service needs a connection to a full node in order to access chain state. The `BLOCKCHAIN_PROVIDER` config should be a url to a node with its JSON RPC enabled.
This could be a node with RPC set up. Preferably this would be an node dedicated to this service. Alternatively, the public Forno endpoints can be used but their uptime guarantees are not as strong. For development with Alfajores, the forno url is `https://alfajores-forno.celo-testnet.org`. For Mainnet, it would be `https://rc1-forno.celo-testnet.org`

- `BLOCKCHAIN_PROVIDER` - The blockchain node provider for chain state access. `

### Keystores

Currently, the service retrieving keys from Azure Key Vault (AKV), Google Secret Manager and AWS Secrets Manager.
You must specify the type, and then the keystore configs for that type.

- `KEYSTORE_TYPE` - `AzureKeyVault`, `GoogleSecretManager` or `AWSSecretManager`

#### Azure Key Vault

Use the following to configure the AKV connection. These values are generated when creating a service principal account (see [Configuring your Key Vault](https://www.npmjs.com/package/@azure/keyvault-keys#configuring-your-key-vault))

- `KEYSTORE_AZURE_CLIENT_ID` - The clientId of the service principal account that has [Get, List] access to secrets.
- `KEYSTORE_AZURE_CLIENT_SECRET` - The client Secret of the same service principal account.
- `KEYSTORE_AZURE_TENANT` - The tenant that the service principal is a member of.
- `KEYSTORE_AZURE_VAULT_NAME` - The name of your Azure Key Vault.
- `KEYSTORE_AZURE_SECRET_NAME` - The name of the secret that holds your BLS key.

#### Google Secret Manager

Use the following to configure the Google Secret Manager. To authenticate with Google Cloud, you can see [Setting Up Authentication](https://cloud.google.com/docs/authentication/production)

- `KEYSTORE_GOOGLE_PROJECT_ID` - The google cloud project id.
- `KEYSTORE_GOOGLE_SECRET_NAME` - The secret's name.
- `KEYSTORE_GOOGLE_SECRET_VERSION` - Secret version (latest by default).

#### AWS Secrets Manager

Use the following to configure the AWS Secrets Manager. To authenticate with Amazon Web Services, you can see [Setting Credentials in Node.js](https://docs.aws.amazon.com/sdk-for-javascript/v2/developer-guide/setting-credentials-node.html). If you are running the signer inside AWS, we do recommend to authenticate using IAM Roles.

- `KEYSTORE_AWS_REGION` - The AWS Region code where the secret is, for example: `us-east-1`.
- `KEYSTORE_AWS_SECRET_NAME` - The secret's name.
- `KEYSTORE_AWS_SECRET_KEY` - The key inside the secret where the private key is save. `key` by default.

## Operations

### Setup

The service requires a connection to a SQL database. The SQL connection parameters should be configured with the `DB_*` configs stated above.

Once the database connection is established, the tables can be set up with the migration script. Set the DB env variables and then run: `yarn db:migrate`

### Running locally

- `yarn install`
- `yarn start`

Error logs will be prefixed with `CELO_PNP_ERROR_XX`.  You can see a full list of them in [error.utils.ts](https://github.com/celo-org/celo-monorepo/blob/master/packages/phone-number-privacy/signer/src/common/error-utils.ts).

### Running in docker

Docker images for the signer service are published to Celo's [container registry on Google Cloud](https://console.cloud.google.com/gcr/images/celo-testnet/US/celo-monorepo). Search for images with tag `phone-number-privacy-*`.

- `docker pull us.gcr.io/celo-testnet/celo-monorepo:phone-number-privacy-{LATEST_TAG_HERE}`
- `docker run -d -p 80:8080 {ENV_VARS_HERE} {CONTAINER_TAG_HERE}`
