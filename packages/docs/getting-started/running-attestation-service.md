# Running the Attestation Service

- [Running the Attestation Service](#running-the-attestation-service)
  - [Environment variables](#environment-variables)
  - [Sms Providers](#sms-providers)
    - [Nexmo](#nexmo)
    - [Twilio](#twilio)
  - [Accounts Configuration](#accounts-configuration) \* [Database Configuration](#database-configuration)
  - [Executing the Attestation Service](#executing-the-attestation-service)
  - [Registering the Attestation Service](#registering-the-attestation-service)

As part of the [lightweight identity protocol](/celo-codebase/protocol/identity), validators are expected to run an Attestation Service to provide attestations that allow users to map their phone number to an account on Celo. The Attestation Service is a simple Node.js application that can be run with a Docker image.

## Environment variables

The service needs the following environment variables:

| Variable                   | Explanation                                                                                                                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DATABASE_URL               | The URL under which your database is accessible, currently supported are `postgres://`, `mysql://` and `sqlite://`                                                                    |  |
| CELO_PROVIDER              | The endpoint under which your node with the unlocked attestation signer key is available, should be `http://localhost:8545` if you followed the [instructions](./running-a-validator) |  |
| CELO_VALIDATOR_ADDRESS     | The address of the Validator account                                                                                                                                                  |  |
| ATTESTATION_SIGNER_ADDRESS | The address of the attestation signer that was authorized by the Validator account                                                                                                    |  |
| APP_SIGNATURE              | The hash with which clients can auto-read SMS messages on android                                                                                                                     |  |
| SMS_PROVIDERS              | A comma-separated list of providers you want to configure, we currently support `nexmo` & `twilio`                                                                                    |  |

A part of that we are going to setup the following environment variable about the Attestation Service Docker image:

```bash
export CELO_IMAGE_ATTESTATION="us.gcr.io/celo-testnet/celo-monorepo:attestation-service-708ea8b24736a755c4dd3792e8973a6f0bf92b1f91edceb8e0b603ad66f2d70c"
```

## Sms Providers

Currently the Sms providers supported are Nexmo & Twilio. You can create your user account in the provider of your election using the [Nexmo Sign Up form](https://dashboard.nexmo.com/sign-up) or the [Twilio Sign Up form](https://www.twilio.com/try-twilio).

### Twilio

Twilio is the most common and popular provider. For that you will need to provision the following variables:

| Variable                     | Explanation                                                     |
| ---------------------------- | --------------------------------------------------------------- |
| TWILIO_ACCOUNT_SID           | The Twilio account ID                                           |
| TWILIO_MESSAGING_SERVICE_SID | The Twilio Message Service ID. Starts by `MG`                   |
| TWILIO_AUTH_TOKEN            | The API authentication token                                    |
| TWILIO_BLACKLIST             | A comma-sperated list of country codes you do not want to serve |

**Setup**
After you signed up for Twilio at [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio), you should see your `ACCOUNT SID` and your `AUTH_TOKEN` in the top right of the console. You'll also want to enter in a credit card to fund the account. For most text messages, the costs will be very low. Find a more comprehensive price list at [https://www.twilio.com/sms/pricing](https://www.twilio.com/sms/pricing). If there are countries that you do not want to serve, you can specify them with the `TWILIO_BLACKLIST`.

To actually be able to send SMS, you need to create a messaging service under [Programmable SMS > SMS](https://www.twilio.com/console/sms/services). The resulting `SID` you want to specify under the `TWILIO_MESSAGING_SERVICE_SID`. Now that you have provisioned your messaging service, you need to buy at least 1 phone number to send SMS from. You can do so under the `Numbers` option of the messaging service page. To maximize the chances of reliable and prompt SMS sending (and thus attestation fee revenue), you can buy numbers in many locales, and Twilio will intelligently select the best number to send each SMS.

### Nexmo

Here is the list of the enviromnet variables needed to use the Nexmo SMS broker:

| Variable        | Explanation                                                     |
| --------------- | --------------------------------------------------------------- |
| NEXMO_KEY       | The API key to the Nexmo API                                    |
| NEXMO_SECRET    | The API secret to the Nexmo API                                 |
| NEXMO_BLACKLIST | A comma-sperated list of country codes you do not want to serve |

#### Database Configuration

For storing and retrieving the attestation requests the service needs a database to persist that information. Currently `sqlite`, `postgres` and `mysql` are supported. For testing purposes you can use `sqlite` but it's recommended to run a stand-alone database server using `mysql` or `postgres` if your intention is running the Attestation Service in a production environment. If you are running on a popular cloud provider, consider using their hosted SQL services.

Depending on your database technology you need to create a database with the access for a specific user and password.

For specifying the database url you need to setup the `DATABASE_URL` variable:

```bash
export DATABASE_URL="sqlite://db/attestation.db"
export DATABASE_URL="mysql://user:password@mysql.example.com:3306/attestation-service"
export DATABASE_URL="postgres://user:password@postgres.example.com:5432/attestation-service"
```

## Executing the Attestation Service

The following command for running the Attestation Service is using Nexmo, but you can adapt for using Twilio easily:

```bash
docker run --name celo-attestation-service -d --restart always --entrypoint /bin/bash -e ATTESTATION_SIGNER_ADDRESS=$ATTESTATION_SIGNER_ADDRESS -e CELO_VALIDATOR_ADDRESS=0x$CELO_VALIDATOR_ADDRESS -e CELO_PROVIDER=$CELO_PROVIDER -e DATABASE_URL=$DATABASE_URL -e SMS_PROVIDERS=nexmo -e NEXMO_KEY=$NEXMO_KEY -e NEXMO_SECRET=$NEXMO_SECRET -e NEXMO_BLACKLIST=$NEXMO_BLACKLIST -p 3000:80 $CELO_IMAGE_ATTESTATION -c " cd /celo-monorepo/packages/attestation-service && yarn run db:migrate && yarn start "
```

## Registering the Attestation Service

In order for users to request attestations from your service, you need to register the endpoint under which your service is reachable in your [metadata](/celo-codebase/protocol/identity/metadata). Run the following commands on your local machine where `$CELO_VALIDATOR_ADDRESS` is unlocked.

```bash
celocli account:create-metadata ./metadata.json --from $CELO_VALIDATOR_ADDRESS
```

The `ATTESTATION_SERVICE_URL` variable stores the URL to access the Attestation Service deployed. In the following command we specify the URL where this Attestation Service is:

```bash
celocli account:claim-attestation-service-url ./metadata.json --url $ATTESTATION_SERVICE_URL --from $CELO_VALIDATOR_ADDRESS
```

And then host your metadata somewhere reachable via HTTP. You can use a service like [gist.github.com](https://gist.github.com). Create a gist with the contents of the file and then click on the `Raw` buttton to receive the permalink to the machine-readable file.

```bash
celocli account:register-metadata --url <METADATA_URL> --from $CELO_VALIDATOR_ADDRESS
```

If everything goes well users should see that you are ready for attestations by running:

```bash
celocli account:get-metadata $CELO_VALIDATOR_ADDRESS
```
