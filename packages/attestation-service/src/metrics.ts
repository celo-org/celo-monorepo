import { Counter } from 'prom-client'

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
    help: 'Counter for the number of requests that could not be served',
  }),
  attestationRequestsSentSms: new Counter({
    name: 'attestation_requests_sent_sms',
    help: 'Counter for the number of sms sent',
  }),
  attestationRequestsFailedToSendSms: new Counter({
    name: 'attestation_requests_failed_to_send_sms',
    help: 'Counter for the number of sms that failed to send',
  }),
  attestationRequestUnexpectedErrors: new Counter({
    name: 'attestation_requests_unexpected_errors',
    help: 'Counter for the number of unexpected errrors',
  }),
}
