import * as client from 'prom-client'

const { Counter, Histogram } = client

client.collectDefaultMetrics()

// This is just so autocomplete will remind devs what the options are.
export enum Labels {
  READ = 'read',
  UPDATE = 'update',
  INSERT = 'insert',
  BATCH_DELETE = 'batch-delete',
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
    name: 'database_errors',
    help: 'Counter for the number of database errors',
    labelNames: ['type'],
  }),
  blockchainErrors: new Counter({
    name: 'blockchain_errors',
    help: 'Counter for the number of errors from interacting with the blockchain',
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
    help: 'Counter for the number of requests in which WALLET_KEY authentication is used',
  }),
  testQuotaBypassedRequests: new Counter({
    name: 'test_quota_bypassed_requests',
    help: 'Counter for the number of requests not requiring quota (testing only)',
  }),
  timeouts: new Counter({
    name: 'timeouts',
    help: 'Counter for the number of signer timeouts as measured by the signer',
  }),
  errorsCaughtInEndpointHandler: new Counter({
    name: 'errors_caught_in_endpoint_handler',
    help: 'Counter for the number of errors caught in the outermost endpoint handler',
  }),
  errorsThrownAfterResponseSent: new Counter({
    name: 'errors_thrown_after_response_sent',
    help: 'Counter for the number of errors thrown after a response was already sent',
  }),
  connectionClosed: new Counter({
    name: 'connection_closed',
    help: 'Counter for the number of closed connections caught in Signer',
  }),
}
const buckets = [
  0.001, 0.01, 0.1, 0.2, 0.3, 0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.2, 1.4, 1.6, 1.8, 2, 2.3, 2.6, 2.9, 3.5,
  4, 5, 10,
]

export const Histograms = {
  responseLatency: new Histogram({
    name: 'signature_endpoint_latency',
    help: 'Histogram tracking latency of signature endpoint',
    labelNames: ['endpoint'],
    buckets,
  }),
  fullNodeLatency: new Histogram({
    name: 'full_node_latency',
    help: 'Histogram tracking latency of full node requests',
    labelNames: ['codeSegment'],
    buckets,
  }),
  dbOpsInstrumentation: new Histogram({
    name: 'db_ops_instrumentation',
    help: 'Histogram tracking latency of all database operations',
    labelNames: ['operation'],
    buckets,
  }),
  userRemainingQuotaAtRequest: new Histogram({
    name: 'user_remaining_quota_at_request',
    help: 'Histogram tracking remaining quota of users at time of request',
    labelNames: ['endpoint'],
    buckets,
  }),
}

export function newMeter(
  histogram: client.Histogram<string>,
  ...labels: string[]
): <U>(fn: () => Promise<U>) => Promise<U> {
  return (fn) => {
    const _meter = histogram.labels(...labels).startTimer()
    return fn().finally(_meter)
  }
}
