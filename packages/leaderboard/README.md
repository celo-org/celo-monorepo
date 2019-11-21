## What does it do?

Reads from Google sheet https://docs.google.com/spreadsheets/d/1d3pZNof8p3z8M9O3MH5FZG5dA3e-L52XiJ4qA5o7X0Y

Reads and verifies account claims.

Reads the exchange rate into DB.

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

Using ganache

```
export NO_SYNCCHECK=true
yarn run celocli account:register --name "account 1" --from 0x5409ED021D9299bf6814279A6A1411A7e866A631
yarn run celocli account:register --name "account 2" --from 0x6Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb
yarn run celocli account:create-metadata --from 0x5409ED021D9299bf6814279A6A1411A7e866A631 /var/www/html/samples/metadata2.json
yarn run celocli account:create-metadata --from 0x6Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb /var/www/html/samples/metadata1.json
yarn run celocli account:register-metadata --from 0x5409ED021D9299bf6814279A6A1411A7e866A631 --url http://localhost/samples/metadata2.json
yarn run celocli account:register-metadata --from 0x6Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb --url http://localhost/samples/metadata1.json
yarn run celocli account:claim-account /var/www/html/samples/metadata2.json --address=0x6Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb --from=0x5409ED021D9299bf6814279A6A1411A7e866A631
yarn run celocli account:claim-account /var/www/html/samples/metadata1.json --address=0x5409ED021D9299bf6814279A6A1411A7e866A631 --from=0x6Ecbe1DB9EF729CBe972C83Fb886247691Fb6beb
```
