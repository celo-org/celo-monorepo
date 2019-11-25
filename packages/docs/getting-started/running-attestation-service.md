# Running the Attestation Service

- [Running the Attestation Service](#running-the-attestation-service)
  - [Environment variables](#environment-variables)
  - [Sms Providers](#sms-providers)
    - [Nexmo](#nexmo)
    - [Twilio](#twilio)
  - [Accounts Configuration](#accounts-configuration) \* [Database Configuration](#database-configuration)
  - [Executing the Attestation Service](#executing-the-attestation-service)

As part of the [lightweight identity protocol](/celo-codebase/protocol/identity), validators are expected to run an Attestation Service to provide attestations that allow users to map their phone number to an account on Celo. The Attestation Service is a simple Node.js application that can be run with a Docker image.

## Environment variables

The service needs the following environment variables:

| Variable                | Explanation                                                                                                                                                            |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DATABASE_URL            | The URL under which your database is accessible, currently supported are `postgres://`, `mysql://` and `sqlite://`                                                     |  |
| CELO_PROVIDER           | The URL under which a celo blockchain node is reachable, i.e. something like `https://integration-forno.celo-testnet.org`                                              |  |
| ACCOUNT_ADDRESS         | The address of the validator account                                                                                                                                   |  |
| ATTESTATION_PRIVATE_KEY | The private key with which attestations should be signed. You could use your account key for attestations, but really you should authorize a dedicated attestation key |  |
| APP_SIGNATURE           | The hash with which clients can auto-read SMS messages on android                                                                                                      |  |
| SMS_PROVIDERS           | A comma-separated list of providers you want to configure, we currently support `nexmo` & `twilio`                                                                     |  |

## Sms Providers

Currently the Sms providers supported are Nexmo & Twilio. You can create your user account in the provider of your election using the [Nexmo Sign Up form](https://dashboard.nexmo.com/sign-up) or the [Twilio Sign Up form](https://www.twilio.com/try-twilio).

### Nexmo

Here is the list of the enviromnet variables needed to use the Nexmo SMS broker:

| Variable        | Explanation                                                     |
| --------------- | --------------------------------------------------------------- |
| NEXMO_KEY       | The API key to the Nexmo API                                    |
| NEXMO_SECRET    | The API secret to the Nexmo API                                 |
| NEXMO_BLACKLIST | A comma-sperated list of country codes you do not want to serve |

### Twilio

If you prefer using Twilio, this is list of the variables to use:

| Variable                     | Explanation                                                     |
| ---------------------------- | --------------------------------------------------------------- |
| TWILIO_ACCOUNT_SID           | The Twilio account ID                                           |
| TWILIO_MESSAGING_SERVICE_SID | The Twilio Message Service ID. Starts by `MG`                   |
| TWILIO_AUTH_TOKEN            | The API authentication token                                    |
| TWILIO_BLACKLIST             | A comma-sperated list of country codes you do not want to serve |

## Accounts Configuration

First we need to create an account for getting the attestation key needed to sign the attestations. Run:

```bash
celocli account:new
```

We copy the account details and assign the Private Key to the `ATTESTATION_PRIVATE_KEY` environment variable:

```bash
export ATTESTATION_PRIVATE_KEY=0x<Private Key>
export ATTESTATION_ADDRESS=<Account address>
```

You can create a proof of posession of this attestation key by running the CLI commands (remember to prefix the key with 0x)

```bash
celocli account:proof-of-possession --signer $ATTESTATION_ADDRESS --account $CELO_VALIDATOR_ADDRESS --privateKey $ATTESTATION_KEY
```

That will give you a signature that you can then use to authorize the key:

```bash
celocli account:authorize --from $CELO_VALIDATOR_ADDRESS -r attestation --pop SIGNATURE --signer $ATTESTATION_ADDRESS
```

The Attestation Service needs to connect to a Web3 Provider. This is going to depend on the network you want to connect. So depending on which network you are making available the service, you need to configure the `CELO_PROVIDER` variable pointing to that.

For example:

```bash
# Web3 provider for Alfajores network
export CELO_PROVIDER="https://alfajores-forno.celo-testnet.org/"
```

#### Database Configuration

For storing and retrieving the attestation requests the service needs a database to persist that information. Currently `sqlite`, `postgres` and `mysql` are supported. For testing purposes you can use `sqlite` but it's recommended to run a stand-alone database server using `mysql` or `postgres` if your intention is running the Attestation Service in a production environment.

So for specifying the database url you need to setup the `DATABASE_URL` variable:

```bash
export DATABASE_URL="sqlite://db/dev.db"
export DATABASE_URL="mysql://user:password@mysql.example.com:3306/attestation-service"
export DATABASE_URL="postgres://user:password@postgres.example.com:5432/attestation-service"
```

You can find the migration scripts for creating the schema at the `celo-monorepo`, `packages/attestation-service` folder. From there, after setting up the `DATABASE_URL` env variable you can run the following commands:

```bash
yarn run db:create
yarn run db:migrate
```

## Executing the Attestation Service

The following command for running the Attestation Service is using Nexmo, but you can adapt for using Twilio easily:

```bash
docker run -e ATTESTATION_KEY=$ATTESTATION_KEY -e ACCOUNT_ADDRESS=$CELO_VALIDATOR_ADDRESS -e CELO_PROVIDER=$CELO_PROVIDER -e DATABASE_URL=$DATABASE_URL -e SMS_PROVIDERS=nexmo -e NEXMO_KEY=$NEXMO_KEY -e NEXMO_SECRET=$NEXMO_SECRET -e NEXMO_BLACKLIST=$NEXMO_BLACKLIST  -p 3000:80 us.gcr.io/celo-testnet/attestation-service:$CELO_NETWORK
```

In order for users to request attestations from your service, you need to register the endpoint under which your service is reachable in your [metadata](/celo-codebase/protocol/identity/metadata).

```bash
celocli identity:create-metadata ./metadata.json
```

The `ATTESTATION_SERVICE_URL` variable stores the URL to access the Attestation Service deployed. In the following command we specify the URL where this Attestation Service is:

```bash
celocli identity:change-attestation-service-url ./metadata.json --url $ATTESTATION_SERVICE_URL
```

And then host your metadata somewhere reachable via HTTP. You can register your metadata URL with:

```bash
celocli identity:register-metadata --url <METADATA_URL> --from $CELO_VALIDATOR_ADDRESS
```

You can use for testing a gist url (i.e: `https://gist.github.com/john.doe/a29f83d478c9daa2ac52596ba9778391`) or similar where you have publicly available your metadata.

If everything goes well users should see that you are ready for attestations by running:

```bash
celocli identity:get-metadata $CELO_VALIDATOR_ADDRESS
```
