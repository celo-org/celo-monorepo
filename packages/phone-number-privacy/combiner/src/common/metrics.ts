import * as client from 'prom-client'
const { Counter, Histogram } = client

client.collectDefaultMetrics()

export const Counters = {
  requests: new Counter({
    name: 'requests',
    help: 'Counter for the number of requests received',
  }),
  responses: new Counter({
    name: 'responses',
    help: 'Counter for the number of responses sent',
    labelNames: ['statusCode'],
  }),
  missingSignaturesResponses: new Counter({
    name: 'missing_signature_responses',
    help: 'Counter for the number of missing signatures not returned by signer',
  }),
  discrepenciesInSignerBlockNumbers: new Counter({
    name: 'discrepencies_in_signer_block_numbers',
    help: 'Counter for the number of discrepencies in signer block numbers',
  }),
  discrepenciesInSignerQuotaMeasurements: new Counter({
    name: 'discrepencies_in_signer_quota_measurements',
    help: 'Counter for the number of discrepencies in signer quota measurements',
  }),
  discrepenciesInSignerResponses: new Counter({
    name: 'discrepencies_in_signer_responses',
    help: 'Counter for the number of discrepencies in signer responses',
  }),
  signatureRequestsWithoutSessionID: new Counter({
    name: 'signature_requests_without_session_id',
    help: 'Counter for the number of signature requests without a session id',
  }),
  matchmakingRequestsWithoutSessionID: new Counter({
    name: 'matchmaking_requests_without_session_id',
    help: 'Counter for the number of matchmaking requests without a session id',
  }),
}

export const Histograms = {
  percentOfContactsCoveredByMatchmaking: new Histogram({
    name: 'percent_of_contacts_covered_by_matchmaking',
    help: 'Histogram tracking percent of contacts covered by matchmaking accross requests',
  }),
}
