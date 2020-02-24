provider "aws" {
    region = var.region
}

module "celo_cluster" {
  source             = "../testnet"

  region                        = var.region
  cidr_blocks                   = var.cidr_blocks
  key_pair_name                 = var.key_pair_name
  celo_image                    = var.celo_image
  celo_network_id               = var.celo_network_id
  celo_image_attestation        = var.celo_image_attestation
  twilio_messaging_service_sid  = var.twilio_messaging_service_sid
  twilio_account_sid            = var.twilio_account_sid
  twilio_blacklist              = var.twilio_blacklist
  twilio_auth_token             = var.twilio_auth_token
  proxies                       = var.proxies
  validators                    = var.validators
  attestation_services          = var.attestation_services
}