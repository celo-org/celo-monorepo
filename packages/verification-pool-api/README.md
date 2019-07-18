# Verification Pool API

Firebase cloud functions to process verification requests

## Setup

Install packages:
`yarn`

Authenticate:
`yarn firebase login`

## Running locally

There is currently no known way to run firebase functions locally. To test, see deployment section below.

## Testing

To run unit tests:
`yarn test` or `yarn test:verbose`

For lint checks:
`yarn lint-checks`

## Deploy to Firebase Cloud Functions

You have two options for deploying to Firebase Functions:

### 1. Celotool with custom testnet

First, setup a custom testnet that points to your custom pool function.
To do this, edit the `.env` file in monorepo root directory. Edit the `VERIFICATION_POOL_URL` and `VERIFICATION_REWARDS_URL` fields by replacing in `YOUR_ENV_NAME`.
Next, deploy your custom testnet. See the [Bootnode](https://github.com/celo-org/bootnode/tree/master/bootnode-coin) project for details.

Finally, deploy your verification pool function.
For the first deployment:

```
celotooljs deploy initial verification-pool -e YOUR_ENV_NAME
```

And for subsequent updates:

```
celotooljs deploy upgrade verification-pool -e YOUR_ENV_NAME
```

### 2. Local yarn commands

If you run into trouble with celotool, sometimes the print statements (even in verbose mode) do not provide enough information to understand what is going wrong with your deployment. In this case, you might want to deploy your verification-pool with the yarn scripts in this directory.

The commands of interest are

1.  `build` -- compiles your code for a specified environment
2.  `set-config` -- sets your environment specific config variables, like environment tags and ip addresses. You'll only need to do this once, the first time you deploy your test pool. After that it will persist. Call it again to change the variables.
3.  `get-config` -- retrieves the current function config. You can use this to see what the configs look like for other environments
4.  `deploy` -- deploys your code to the firebase server

Running these commands will look like this:

    yarn build YOUR_ENV_NAME

    yarn firebase functions:config:get            # Show the existing function configs (useful for next command)

    yarn set-config YOUR_ENV_NAME --celo-proj YOUR_PROJECT_NAME --testnet-id YOUR_NET_ID --tx-ip YOUR_TX_NODE_IP --tx-port YOUR_RPC_PORT_ON_TX_NODE

    yarn deploy YOUR_ENV_NAME --celo-proj YOUR_PROJECT_NAME

_Note, if you want to build for your custom function but want that function to use the integration network, you'll need to build with env `integration` and then run the firebase deploy functions manually_

    yarn run set-env --celo-env YOUR_ENV_NAME     # Once

    yarn build integration                        # Every time you make changes

    yarn run firebase deploy --only database,hosting,functions:handleVerificationRequestYOUR_ENV_NAME --project celo-testnet

## Testing in Firebase Cloud Functions

You can send post requests to the function using your favorite REST client. Postman works well for this.

Post a json request with a body like this:

    {
      "phoneNumber": "<your_e164_phone_number>",
      "message": "Verification test...",
      "account": "<your_base_64_encoded_address>"
    }

Then check for the logs on stackdriver.

Another great way to test is with the verify script found in the protocol folder.

Another great tip is that you can manually edit the entries in the Firebase Realtime Database through the web console. This helps if you need to modify the state in order to get to the state needed to run the test you are interested in.

## Updating the SMS retriever hash code

For production builds, we need to use the cert google play uses to sign the app in the play store.
This script makes it easy: https://github.com/michalbrz/sms-retriever-hash-generator
Download the .der file from the play store
