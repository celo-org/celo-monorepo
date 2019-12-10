## What does it do?

Reads from Google sheet (template https://docs.google.com/spreadsheets/d/1Me56YkCHYmsN23gSMgDb1hZ_ezN0sTjNW4kyGbAO9vc/edit#gid=0)

Reads and verifies account claims.

Reads the exchange rate into DB.

This script reads data directly into the DB that Blockscout uses, so it needs to be ran on the same machine as Blockscout.

## Environment variables

For Postgres: `PG_USER` and `PG_PASSWORD`

Other variables:

- `LEADERBOARD_DATABASE`: which database to connect into. Defaults to `blockscout`
- `LEADERBOARD_WEB3`: Geth RPC address. Default: `http://localhost:8545`
- `LEADERBOARD_SHEET`: Google spreadsheet identifier. Default: `1HCs1LZv1BOB1v2bVlH4qNPnxVRlYVhQ7CKhkMibE4EY`

## Setup and running

Make sure Postgres is up.

Setting up env variables:

```
export PGUSER=postgres
export PGPASSWORD=1234
```

Make sure geth is running.

Make sure that public can access the spreadsheet: File/Publish to the Web

```
ts-node src/board.ts
```

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
