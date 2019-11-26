## What does it do?

Reads from Google sheet (template https://docs.google.com/spreadsheets/d/1Me56YkCHYmsN23gSMgDb1hZ_ezN0sTjNW4kyGbAO9vc/edit#gid=0)

Reads and verifies account claims.

Reads the exchange rate into DB.

This script reads data directly into the DB that Blockscout uses, so it needs to be ran on the same machine as Blockscout.

## Environment variables

For Postgres: `PG_USER` and `PG_PASSWORD`

Other variables:

- `LEADERBOARD_DATABASE`: which database to connect into. Defaults to `blockscout`
- `LEADERBOARD_TOKEN`: permission token for accessing the sheet, see the JSON format below. Default: read from `token.json`
- `LEADERBOARD_CREDENTIALS`: credentials token for accessing the Google Sheets API, see the JSON format below. Default: read from `credentials.json`
- `LEADERBOARD_WEB3`: Geth RPC address. Default: `http://localhost:8545`
- `LEADERBOARD_SPREET`: Google spreadsheet identifier. Default: `1d3pZNof8p3z8M9O3MH5FZG5dA3e-L52XiJ4qA5o7X0Y`

## Token and credential format

Token sample

```
{
    "access_token": "random stuff",
    "refresh_token": "random junk",
    "scope":"https://www.googleapis.com/auth/spreadsheets.readonly",
    "token_type":"Bearer",
    "expiry_date":1574775683045
}
```

Credential sample

```
{
    "installed":{
        "client_id":"476096020070-mhh2oksek4ekunjh68p7t57rq7djgegh.apps.googleusercontent.com","project_id":"quickstart-1574329758573",
        "auth_uri":"https://accounts.google.com/o/oauth2/auth",
        "token_uri":"https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs",
        "client_secret":"secure string",
        "redirect_uris":["urn:ietf:wg:oauth:2.0:oob","http://localhost"]
        }
}
```

## Setup and running

Make sure Postgres is up.

Setting up env variables:

```
export PGUSER=postgres
export PGPASSWORD=1234
```

Make sure geth is running.

Get credentials for using Google API as explained in
https://developers.google.com/sheets/api/quickstart/nodejs

```
ts-node src/board.ts
```

It will ask a token, it might tell you that it's very unsafe, and it probably is too.

## Account claims

Using ganache and local web server

```
export NO_SYNCCHECK=true
export ACCOUNT1=0x5409ED021D9299bf6814279A6A1411A7e866A631
export ACCOUNT2=0x6Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb
yarn run celocli account:register --name "account 1" --from $ACCOUNT1
yarn run celocli account:register --name "account 2" --from $ACCOUNT2
yarn run celocli account:create-metadata --from $ACCOUNT1 /var/www/html/samples/metadata2.json
yarn run celocli account:create-metadata --from $ACCOUNT2 /var/www/html/samples/metadata1.json
yarn run celocli account:register-metadata --from $ACCOUNT1 --url http://localhost/samples/metadata2.json
yarn run celocli account:register-metadata --from $ACCOUNT2 --url http://localhost/samples/metadata1.json
yarn run celocli account:claim-account /var/www/html/samples/metadata2.json --address=$ACCOUNT2 --from=$ACCOUNT1
yarn run celocli account:claim-account /var/www/html/samples/metadata1.json --address=$ACCOUNT1 --from=$ACCOUNT2
```
