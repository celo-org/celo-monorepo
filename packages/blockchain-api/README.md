# Blockchain Api Service

This sample provides an example of how to compile TypeScript files while
deploying to App Engine.

## Setup

Install dependencies:

    yarn

## Running locally

Build and start:

    yarn start:dev  # Uses tsc-watch to watch the folder and rebuild as needed

## Creating a new instance

    create a new file, app.[CELO_ENV].yaml

## Deploying to App Engine

Deploy your app. The project will be built automatically by Google Cloud Build:

    using celotool:
        yarn run cli deploy upgrade blockchain-api --config CONFIG_FILE --verbose --celo-env CELO_ENV

    Config files per env:
    Prod:
    	app.prod.yaml
    Integration (deployed automatically on master merge):
    	app.int.yaml
    Dev:
    	app.dev.yaml
    Other Environments (eg. Argentina environments):
        app.[CELO_ENV].yaml
