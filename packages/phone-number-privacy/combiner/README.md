# ODIS Combiner

A firebase function that orchestrates distributed BLS threshold signing with the set of ODIS signers.

## DB Migrations

### Add migration file

To update the combiner DB schema, first run `yarn db:migrate:make <migration_name>` to create a new migrations file. Then, fill in the new migration file as needed using the previous migration files as references.

### Whitelist your IP address

Go to [https://console.cloud.google.com/sql/instances?authuser=1&folder=&organizationId=&project=celo-phone-number-privacy] and navigate to the desired workspace and db instance. Then, add your IP address under `Connections -> Authorized networks`.

Remember to remove your IP address from the whitelist when finished.

### Add db credentials to config.ts

Run the command `yarn config:get:<network>` to fetch the necessary db credentials and add them to `src/config.ts` under the `DEV_MODE` section. DO NOT COMMIT THESE CREDENTIALS TO GITHUB.

Note: When you fill in the `host` field you may need to use the database's public IP, which can be found in the `Overview` section under the link above.

### Run migrations

Always run migrations in staging first and ensure all e2e tests pass before migrating in alfajores and mainnet.

Run `yarn db:migrate:<network>`

TODO: Figure out how to make migrations run automatically on deployment
