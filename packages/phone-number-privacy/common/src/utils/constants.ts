// a getContactMatches request with 300 phone numbers still fits under
// this limit.
export const REASONABLE_BODY_CHAR_LIMIT: number = 16_000
export const DB_TIMEOUT = 1000
export const FULL_NODE_TIMEOUT_IN_MS = 1000
export const RETRY_COUNT = 5
export const RETRY_DELAY_IN_MS = 100
export const MAX_BLOCK_DISCREPANCY_THRESHOLD = 3
export const KEY_VERSION_HEADER = 'odis-key-version' // headers must be all lower case
export const MAX_TIMESTAMP_DISCREPANCY_THRESHOLD = 30
export const MAX_TOTAL_QUOTA_DISCREPANCY_THRESHOLD = 5
