import * as client from 'prom-client'
const { Counter, Histogram } = client

client.collectDefaultMetrics()

// This is just so autocomplete will remind devs what the options are.
export const Labels = {
  read: 'read',
  update: 'update',
  insert: 'insert',
}

export const Counters = {
  requests: new Counter({
    name: 'requests',
    help: 'Counter for the number of requests received',
    labelNames: ['endpoint'],
  }),
  responses: new Counter({
    name: 'responses',
    help: 'Counter for the number of responses sent',
    labelNames: ['endpoint', 'statusCode'],
  }),
  databaseErrors: new Counter({
    name: 'database_read_errors',
    help: 'Counter for the number of database read errors',
    labelNames: ['type'],
  }),
  blockchainErrors: new Counter({
    name: 'blockchain_errors',
    help: 'Counter for the number of errors from interacting with the blockchain',
    labelNames: ['type'],
  }),
  signatureComputationErrors: new Counter({
    name: 'signature_computation_errors',
    help: 'Counter for the number of signature computation errors',
  }),
  duplicateRequests: new Counter({
    name: 'duplicate_requests',
    help: 'Counter for the number of duplicate signature requests received',
  }),
  requestsWithWalletAddress: new Counter({
    name: 'requests_with_wallet_address',
    help: 'Counter for the number of requests in which the account uses a different wallet address',
  }),
  requestsWithVerifiedAccount: new Counter({
    name: 'requests_with_verified_account',
    help: 'Counter for the number of requests in which the account is verified',
  }),
  requestsWithUnverifiedAccountWithMinBalance: new Counter({
    name: 'requests_with_verified_account_with_min_balance',
    help:
      'Counter for the number of requests in which the account is not verified but meets min balance',
  }),
  signatureRequestsWithoutSessionID: new Counter({
    name: 'signature_requests_without_session_id',
    help: 'Counter for the number of signature requests without a session id',
  }),
}

export const Histograms = {
  responseLatency: new Histogram({
    name: 'signature_endpoint_latency',
    help: 'Histogram tracking latency of signature endpoint',
    labelNames: ['endpoint'],
  }),
  userRemainingQuotaAtRequest: new Histogram({
    name: 'user_remaining_quota_at_request',
    help: 'Histogram tracking remaining quota of users at time of request',
  }),
}
