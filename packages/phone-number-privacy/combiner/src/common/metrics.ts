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
    name: 'combiner_requests_total',
    help: 'Counter for the number of requests received',
    labelNames: ['endpoint'],
  }),
  responses: new Counter({
    name: 'combiner_responses_total',
    help: 'Counter for the number of responses sent',
    labelNames: ['endpoint', 'statusCode'],
  }),
  blockchainErrors: new Counter({
    name: 'combiner_blockchain_errors_total',
    help: 'Counter for the number of errors from interacting with the blockchain',
  }),
  blsComputeErrors: new Counter({
    name: 'combiner_bls_compute_errors_total',
    help: 'Counter for the number of errors from interacting with the blockchain',
    labelNames: ['signer'],
  }),
  errorsCaughtInEndpointHandler: new Counter({
    name: 'combiner_endpoint_handler_errors_total',
    help: 'Counter for the number of errors caught in the outermost endpoint handler',
    labelNames: ['endpoint'],
  }),
  combinerErrors: new Counter({
    name: 'combiner_errors_total',
    help: 'Counter for the all error types logged in the combiner, excluding errors in signer response data and ERR_09 or ERR_10.',
    labelNames: ['endpoint'],
  }),
}

const buckets = [0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10]

export const Histograms = {
  responseLatency: new Histogram({
    name: 'combiner_endpoint_latency',
    help: 'Histogram tracking latency of combiner endpoints',
    labelNames: ['endpoint'],
    buckets,
  }),
  fullNodeLatency: new Histogram({
    name: 'combiner_full_node_latency',
    help: 'Histogram tracking latency of full node requests',
    labelNames: ['codeSegment'],
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
