variable instance_type {
  type        = string
  description = "AWS instance type for this node"
}

variable subnet_id {
  type        = string
  description = "Subnet ID to place this proxy. This should be a public subnet from your Celo VPC."
}

variable security_group_id {
  type        = string
  description = "VPC Security group for this instance"
}

variable key_pair_name {
  type        = string
  description = "Name of the SSH key pair to access this node from the bastion"
}

variable volume_size {
  type        = number
  description = "GB size for the EBS volume"
  default     = 256
}

variable celo_network_id {
  type = string
}

variable celo_image {
  type = string
}

variable celo_image_attestation {
  type = string
}

variable database_url {
  type = string
}

variable twilio_messaging_service_sid {
  type = string
}

variable twilio_account_sid {
  type = string
}

variable twilio_blacklist {
  type = string
}

variable twilio_auth_token {
  type = string
}

variable attestation_services {
  description = "Configuration for attestation nodes."
  type = map(object({
    validator_name                               = string
    validator_address                            = string
    attestation_signer_address                   = string
    attestation_signer_private_key_filename      = string
    attestation_signer_private_key_file_contents = string
    attestation_signer_private_key_password      = string
  }))
}