provider "aws" {
  region = var.region
}

terraform {
  required_version = ">= 0.12.0"
  # We recommend using remote state for production configs. 
  # Uncomment and update the config block below to use remote state.
  #
  # backend "s3" {
  #     bucket          = "mybucket"
  #     key             = "mytfs/celo/terraform.tfstate"
  #     region          = "myregion"

  #     dynamodb_table  = "mydynamodb_table"
  #     encrypt         = true
  # }
}

module "celo_cluster" {
  source = "../../testnet"

  region                       = var.region
  cidr_blocks                  = var.cidr_blocks
  key_pair_name                = var.key_pair_name
  celo_image                   = var.celo_image
  celo_network_id              = var.celo_network_id
  celo_image_attestation       = var.celo_image_attestation
  ethstats_host                = var.ethstats_host
  twilio_messaging_service_sid = var.twilio_messaging_service_sid
  twilio_verify_service_sid    = var.twilio_verify_service_sid
  twilio_account_sid           = var.twilio_account_sid
  twilio_unsupported_regions   = var.twilio_unsupported_regions
  twilio_auth_token            = var.twilio_auth_token
  nexmo_api_key                = var.nexmo_api_key
  nexmo_api_secret             = var.nexmo_api_secret
  nexmo_unsupported_regions    = var.nexmo_unsupported_regions
  proxies                      = var.proxies
  validators                   = var.validators
  attestation_services         = var.attestation_services
}