import { Counter, Gauge } from 'prom-client'

export const Counters = {
  attestationRequestsTotal: new Counter({
    name: 'attestation_requests_total',
    help: 'Counter for the number of attestation requests',
  }),
  attestationRequestsAlreadySent: new Counter({
    name: 'attestation_requests_already_sent',
    help: 'Counter for the number of attestation requests that were already sent',
  }),
  attestationRequestsWrongIssuer: new Counter({
    name: 'attestation_requests_wrong_issuer',
    help: 'Counter for the number of attestation requests that specified the wrong issuer',
  }),
  attestationRequestsWOIncompleteAttestation: new Counter({
    name: 'attestation_requests_without_incomplete_attestation',
    help:
      'Counter for the number of attestation requests for which no incomplete attestations could be found',
  }),
  attestationRequestsValid: new Counter({
    name: 'attestation_requests_valid',
    help: 'Counter for the number of requests involving valid attestation requests',
  }),
  attestationRequestsAttestationErrors: new Counter({
    name: 'attestation_requests_attestation_errors',
    help: 'Counter for the number of requests for which producing the attestation failed',
  }),
  attestationRequestsUnableToServe: new Counter({
    name: 'attestation_requests_unable_to_serve',
    labelNames: ['country'],
    help: 'Counter for requests not served because no provider was configured, by country',
  }),
  attestationRequestsSentSms: new Counter({
    name: 'attestation_requests_sent_sms',
    help: 'Counter for the number of sms sent',
  }),
  attestationRequestsFailedToSendSms: new Counter({
    name: 'attestation_requests_failed_to_send_sms',
    help: 'Counter for the number of sms that failed to send',
  }),
  attestationRequestsBelievedDelivered: new Counter({
    name: 'attestation_requests_believed_delivered_sms',
    help: 'Counter for the number of sms that delivered with or without receipt',
  }),
  attestationRequestsFailedToDeliverSms: new Counter({
    name: 'attestation_requests_failed_to_deliver_sms',
    help: 'Counter for the number of sms that sent but failed to deliver',
  }),
  attestationRequestUnexpectedErrors: new Counter({
    name: 'attestation_requests_unexpected_errors',
    help: 'Counter for the number of unexpected errors',
  }),
  attestationProviderDeliveryStatus: new Counter({
    name: 'attestation_attempts_delivery_status',
    labelNames: ['provider', 'country', 'status'],
    help: 'Counter for status of each delivery attempt by provider and country',
  }),
  attestationProviderDeliveryErrorCodes: new Counter({
    name: 'attestation_attempts_delivery_error_codes',
    labelNames: ['provider', 'country', 'code'],
    help: 'Counter for error code of each failed delivery attempt by provider and country',
  }),
}

export const Gauges = {
  attestationProviderBalance: new Gauge({
    name: 'attestation_provider_balance',
    labelNames: ['provider'],
    help: 'Gauge for provider outstanding account balance',
  }),
}
