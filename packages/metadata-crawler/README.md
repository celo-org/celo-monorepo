# Metadata Crawler

This package connects to Blockscout database, get all the metadata urls, 
verify the metadata claims and update the database if the user claims
could be verified succesfully.

For this package to work properly, the software must have SELECT and UPDATE 
access to the Blockscout database.


## Build

You can build the crawler executing:

```bash
yarn && yarn build
```

## Running the crawler

For connecting to the Blockscout is necessary to setup the following environment variables:

```bash
export PGUSER="postgres" # Database user
export PGPASSWORD="" # Database password
export PGHOST="127.0.0.1" # Database host
export PGPORT="5432" # Database port
export PGDATABASE="blockscout" # Database name
export PROVIDER_URL="http://localhost:8545" # Provider Url
```

You can start the crawler executing:

```bash
yarn dev
```
