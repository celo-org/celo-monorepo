# Notification Service

This service is responsible for dispatching notifications to mobile clients.

## Setup

Install dependencies:

    yarn

## Running locally

First, you will need to download service account key json file for this app's Google Cloud Project, which is currently celo-mobile-org. Add that file as `serviceAccountKey.json` in the `/config` folder.

Next, run this task to build, configure, and start the service:

    yarn start:local

## Deploying to App Engine

Deploy your app. The project will be built automatically by Google Cloud Build:

    yarn deploy -n {ENVIRONMENT}

Current supported environments are production, integration, staging-argentina

# Running in App Engine

App Engine will first run `npm run gcp-build` to build the project then `npm run start` to start it.
Keep that in mind if you are making changes to those tasks.
