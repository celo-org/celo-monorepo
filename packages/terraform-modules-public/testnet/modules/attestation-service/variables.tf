variable deploy_attestation_service {
  type        = bool
  description = ""
}

variable celo_env {
  type        = string
  description = ""
}

variable gcloud_region {
  type        = string
  description = ""
}

variable attestation_service_docker_image_repository {
  type        = string
  description = ""
}

variable attestation_service_docker_image_tag {
  type        = string
  description = ""
}

variable db_username {
  type        = string
  description = ""
}

variable db_password {
  type        = string
  description = ""
}

variable network_name {
  type        = string
  description = ""
}

variable attestation_key {
  type        = string
  description = ""
}

variable account_address {
  type        = string
  description = ""
}

variable celo_provider {
  type        = string
  description = ""
}

variable sms_providers {
  type        = string
  description = ""
}

variable nexmo_key {
  type        = string
  description = ""
}

variable nexmo_secret {
  type        = string
  description = ""
}

variable nexmo_blacklist {
  type        = string
  description = ""
}

variable twilio_account_sid {
  type        = string
  description = ""
}

variable twilio_messaging_service_sid {
  type        = string
  description = ""
}

variable twilio_auth_token {
  type        = string
  description = ""
}

variable twilio_blacklist {
  type        = string
  description = ""
}
