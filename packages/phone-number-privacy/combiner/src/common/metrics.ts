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
  blockchainErrors: new Counter({
    name: 'blockchain_errors',
    help: 'Counter for the number of errors from interacting with the blockchain',
  }),
}

const buckets = [0.001, 0.01, 0.1, 0.5, 1, 2, 5, 10]

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
