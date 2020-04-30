variable attestation_service_count {
  type        = number
  description = "Number of Attestation Service to deploy"
}

variable celo_env {
  type        = string
  description = "Name of the testnet Celo environment"
}

variable gcloud_region {
  type        = string
  description = "Name of the Google Cloud region to use"
}

variable instance_type {
  description = "The instance type"
  type        = string
  default     = "n1-standard-1"
}

variable attestation_service_docker_image_repository {
  type        = string
  description = "The docker image repository for the attestation service"
}

variable attestation_service_docker_image_tag {
  type        = string
  description = "The docker image tag for the attestation service"
}

variable db_username {
  type        = string
  description = "The User for the database"
}

variable db_password {
  type        = string
  description = "The password for the database"
}

variable network_name {
  type        = string
  description = "The name of the network to use"
}

variable account_address {
  type        = list(string)
  description = "The account address for signing the attestations. Must be an authorized address of the associated validator"
}

variable attestation_key {
  type        = list(string)
  description = "The account private key for signing the attestations. Must be the private key of an authorized address for the associated validator"
}

variable celo_provider {
  type        = string
  description = "The URL for the RPC interface for the Celo network"
}

variable sms_providers {
  type        = string
  description = "The SMS Service provider. Must be nexmo or twilio"
}

variable nexmo_key {
  type        = string
  description = "Nexmo api key (check nexmo documentation)"
}

variable nexmo_secret {
  type        = string
  description = "Nexmo api secret (check nexmo documentation)"
}

variable nexmo_blacklist {
  type        = string
  description = "Nexmo blacklisted country codes, separated by comma (check nexmo documentation)"
}

variable twilio_account_sid {
  type        = string
  description = "Twilio account SID (check twilio documentation)"
}

variable twilio_messaging_service_sid {
  type        = string
  description = "Twilio account messagin service SID (check twilio documentation)"
}

variable twilio_auth_token {
  type        = string
  description = "Twilio account Auth Token (check twilio documentation)"
}

variable twilio_blacklist {
  type        = string
  description = "Twilio blacklisted country codes, separated by comma  (check twilio documentation)"
}
