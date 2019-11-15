# Attestation Service

This is the attestation service that validators run on the Celo network to provide attestations of phone numbers to accounts.

### Configuration

You can use the following environment variables to configure the attestation service:

- `DATABASE_URL` - The URL under which your database is accessible, currently supported are `postgres://`, `mysql://` and `sqlite://`
- `CELO_PROVIDER` - The URL under which a celo blockchain node is reachable, i.e. something like `https://integration-forno.celo-testnet.org`
- `ACCOUNT_ADDRESS` - The address of the account on the `Accounts` smart contract
- `ATTESTATION_KEY` - The private key with which attestations should be signed. You could use your account key for attestations, but really you should authorize a dedicated attestation key
- `APP_SIGNATURE` - The hash with which clients can auto-read SMS messages on android
- `SMS_PROVIDERS` - A comma-separated list of providers you want to configure, we currently support:

`nexmo`

- `NEXMO_KEY` - The API key to the Nexmo API
- `NEXMO_SECRET` - The API secret to the Nexmo API
- `NEXMO_BLACKLIST` - A comma-sperated list of country codes you do not want to serve

### Contributing

After checking out the source, you should create a local sqlite database by running:

```sh
yarn run db:create:dev
yarn run db:migrate:dev
```

You will also have to set the environment variables in `.env.development`

Then start the service with `yarn run dev` (you'll have to add the appropriate credentials for the text providers)
