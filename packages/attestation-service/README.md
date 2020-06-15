# Attestation Service

A service run by validators on the Celo network to send SMS messages, enabling attestations of user phone numbers and their accounts on the Celo network.

### Configuration

You can use the following environment variables to configure the attestation service:

- `DATABASE_URL` - The URL under which your database is accessible, currently supported are `postgres://`, `mysql://` and `sqlite://`
- `CELO_PROVIDER` - The URL under which a celo blockchain node is reachable. This node should also have the `ATTESTATION_SIGNER_ADDRESS` unlocked for signing of the attestations themselves.
- `CELO_VALIDATOR_ADDRESS` - The address of the validator on the `Accounts` smart contract
- `ATTESTATION_SIGNER_ADDRESS` - The address of the key with which attestations should be signed.
- `SMS_PROVIDERS` - A comma-separated list of providers you want to configure, we currently support:

`nexmo`

- `NEXMO_KEY` - The API key to the Nexmo API
- `NEXMO_SECRET` - The API secret to the Nexmo API
- `NEXMO_BLACKLIST` - A comma-sperated list of country codes you do not want to serve

`twilio`

- `TWILIO_ACCOUNT_SID` - The SID of your Twilio account
- `TWILIO_MESSAGE_SERVICE_SID` - The SID of the messaging service you want to use. The messaging service should have at least 1 phone number associated with it.
- `TWILIO_AUTH_TOKEN` - The auth token for your Twilio account

### Operations

This service uses `bunyan` for structured logging with JSON lines. You can pipe STDOUT to `yarn run bunyan` for a more human friendly output. The `LOG_LEVEL` environment variable can specify desired log levels. We support the following `LOG_FORMAT`s:

- Default are json lines `LOG_FORMAT=json`
- With `LOG_FORMAT=stackdriver` you can get stackdriver specific format to recover information such as error traces etc.
- To get something more human readable, use `LOG_FORMAT=human`

This service exposes prometheus metrics under `/metrics`.

### Running locally

After checking out the source, you should create a local sqlite database by running:

```sh
yarn run db:create:dev
yarn run db:migrate:dev
```

You will also have to set the environment variables in `.env.development`

Then start the service with `yarn run dev` (you'll have to add the appropriate credentials for the text providers)
