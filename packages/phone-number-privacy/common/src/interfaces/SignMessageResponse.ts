export interface SignMessageResponse {
  success: boolean
  signature?: string
  version?: string
  error?: string
  performedQueryCount?: number
  totalQuota?: number
}
