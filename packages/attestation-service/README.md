# Attestation Service

A service run by validators on the Celo network to send SMS messages, enabling attestations of user phone numbers and their accounts on the Celo network.

## Validators

Please see [the Celo docs](https://docs.celo.org/validator-guide/attestation-service#configuration) for information on configuring and running an attestation service.

## Developers

More information about error codes and configuration parameters can be found in [the Celo docs](https://docs.celo.org/validator-guide/attestation-service).

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
