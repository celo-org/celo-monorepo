# Transaction Metrics Exporter

For this package to work properly, contracts must be deployed.

The env variable `WEB3_PROVIDER` must be set. When testing locally, you can
use `celotooljs port-forward -e SOME_ENV` and set `WEB3_PROVIDER="ws://localhost:8546"`

You can then start the server on port `3000` by running `yarn dev`.
Metrics are exposed as the prometheus format under `/metrics` and it logs structured
JSON of blocks and headers to STDOUT.
