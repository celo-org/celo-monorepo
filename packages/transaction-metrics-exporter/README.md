# Transaction Metrics Exporter

For this package to work properly, you'll need to have the web3 contracts under `src/contracts`. You can get them with celotooljs

`celotooljs copy-contract-artifacts --celo-env integration --contracts=AddressBasedEncryption,Auction,BSTAuction,Escrow,Exchange,GoldToken,Medianator,MultiSig,Reserve,StableToken --outputPath $(pwd)/src/contracts`

You can then start the server by running `yarn start`. Metrics are exposed as the prometheus format under `/metrics` and it logs structured JSON of blocks and headers to STDOUT.
