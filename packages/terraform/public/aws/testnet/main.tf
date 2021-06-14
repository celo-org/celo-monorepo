provider "aws" {
  // version = "~> 2.0"
  region = var.aws["region"]
}

locals {
  prefix = "${var.celo_env}"
}

# Data resources
data "http" "genesis" {
  url = "https://storage.googleapis.com/genesis_blocks/${var.celo_env}"

  request_headers = {
    "Accept" = "application/json"
  }
}

data "http" "bootnodes" {
  url = "https://storage.googleapis.com/env_bootnodes/${var.celo_env}"

  request_headers = {
    "Accept" = "text/plain"
  }
}

# Creating a new VPC for resources
data "aws_availability_zones" "available" {
  state = "available"
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "2.21.0"

  name = "${locals.prefix}-vpc"

  cidr = "10.0.0.0/16"

  azs = [
    data.aws_availability_zones.available.names[0],
    data.aws_availability_zones.available.names[1],
    data.aws_availability_zones.available.names[2],
  ]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_ipv6 = false

  enable_nat_gateway = true
  single_nat_gateway = true

  tags = {
    Owner       = "terraform"
    Environment = var.celo_env
  }

  vpc_tags = {
    Name = "${locals.prefix}-vpc"
  }
}

module "proxy" {
  source = "./modules/proxy"
  # variables
  block_time                            = var.block_time
  celo_env                              = var.celo_env
  instance_type                         = var.instance_types["proxy"]
  ethstats_host                         = var.ethstats_host
  genesis_content_base64                = base64encode(data.http.genesis.body)
  geth_exporter_docker_image_repository = var.geth_exporter_docker_image_repository
  geth_exporter_docker_image_tag        = var.geth_exporter_docker_image_tag
  geth_node_docker_image_repository     = var.geth_node_docker_image_repository
  geth_node_docker_image_tag            = var.geth_node_docker_image_tag
  geth_verbosity                        = var.geth_verbosity
  in_memory_discovery_table             = var.in_memory_discovery_table
  istanbul_request_timeout_ms           = var.istanbul_request_timeout_ms
  network_id                            = var.network_id
  network_name                          = var.network_name
  tx_node_count                         = var.tx_node_count
  validator_count                       = var.validator_count
  reset_geth_data                       = var.reset_geth_data

  proxy_name                         = var.proxy_name
  proxy_private_keys                 = var.proxy_private_keys
  validator_signer_account_addresses = var.validator_signer_account_addresses
  bootnodes_base64                   = base64encode(data.http.bootnodes.body)
}

module "validator" {
  source = "./modules/validator"
  # variables
  block_time                            = var.block_time
  celo_env                              = var.celo_env
  instance_type                         = var.instance_types["validator"]
  ethstats_host                         = var.ethstats_host
  genesis_content_base64                = base64encode(data.http.genesis.body)
  geth_exporter_docker_image_repository = var.geth_exporter_docker_image_repository
  geth_exporter_docker_image_tag        = var.geth_exporter_docker_image_tag
  geth_node_docker_image_repository     = var.geth_node_docker_image_repository
  geth_node_docker_image_tag            = var.geth_node_docker_image_tag
  geth_verbosity                        = var.geth_verbosity
  in_memory_discovery_table             = var.in_memory_discovery_table
  istanbul_request_timeout_ms           = var.istanbul_request_timeout_ms
  network_id                            = var.network_id
  network_name                          = var.network_name
  tx_node_count                         = var.tx_node_count
  validator_count                       = var.validator_count
  reset_geth_data                       = var.reset_geth_data

  validator_name                     = var.validator_name
  validator_signer_account_addresses = var.validator_signer_account_addresses
  validator_signer_account_passwords = var.validator_signer_account_passwords
  validator_signer_private_keys      = var.validator_signer_private_keys
  proxy_enodes                       = var.proxy_enodes
  proxy_internal_ips                 = module.proxy.internal_ip_addresses
  proxy_external_ips                 = module.proxy.external_ip_addresses
}

// ----

// data "google_compute_network" "celo" {
//   name       = var.network_name
//   depends_on = [var.network_depends_on]
// }

// data "google_compute_subnetwork" "celo" {
//   name       = var.network_name
//   region     = var.gcloud_region
//   depends_on = [var.network_depends_on]
// }

// # GCP resources
// resource "google_compute_firewall" "ssh_firewall" {
//   name    = "${var.celo_env}-ssh-firewall"
//   network = var.network_name

//   target_tags = concat(local.firewall_target_tags_txnode, local.firewall_target_tags_validator, local.firewall_target_tags_proxy, local.firewall_target_tags_attestation_service)

//   allow {
//     protocol = "tcp"
//     ports    = ["22"]
//   }
// }

// resource "google_compute_firewall" "geth_firewall" {
//   name    = "${var.celo_env}-geth-firewall"
//   network = var.network_name

//   target_tags = concat(local.firewall_target_tags_txnode, local.firewall_target_tags_proxy)

//   allow {
//     protocol = "tcp"
//     ports    = ["30303"]
//   }

//   allow {
//     protocol = "udp"
//     ports    = ["30303"]
//   }
// }

// resource "google_compute_firewall" "geth_firewall_validator" {
//   name    = "${var.celo_env}-geth-firewall-validator"
//   network = var.network_name

//   target_tags = concat(local.firewall_target_tags_validator)

//   allow {
//     protocol = "tcp"
//     ports    = ["30303"]
//   }
// }

// resource "google_compute_firewall" "geth_metrics_firewall" {
//   name    = "${var.celo_env}-geth-metrics-firewall"
//   network = var.network_name

//   target_tags = concat(local.firewall_target_tags_txnode, local.firewall_target_tags_validator, local.firewall_target_tags_proxy)

//   # allow all IPs internal to the VPC
//   source_ranges = [data.google_compute_subnetwork.celo.ip_cidr_range]

//   allow {
//     protocol = "tcp"
//     ports    = ["9200"]
//   }
// }

// resource "google_compute_firewall" "rpc_firewall" {
//   name    = "${var.celo_env}-rpc-firewall"
//   network = var.network_name

//   target_tags = local.firewall_target_tags_txnode

//   allow {
//     protocol = "tcp"
//     ports    = ["8545", "8546"]
//   }
// }

// resource "google_compute_firewall" "proxy" {
//   name    = "${var.celo_env}-proxy-firewall"
//   network = var.network_name

//   target_tags   = local.firewall_target_tags_proxy
//   source_ranges = [data.google_compute_subnetwork.celo.ip_cidr_range]

//   allow {
//     protocol = "tcp"
//     ports    = ["30503"]
//   }
// }

// resource "google_compute_firewall" "attestation-service" {
//   name    = "${var.celo_env}-attestation-service-firewall"
//   network = var.network_name

//   target_tags   = local.firewall_target_tags_attestation_service
//   source_ranges = [data.google_compute_subnetwork.celo.ip_cidr_range]

//   allow {
//     protocol = "tcp"
//     ports    = ["80"]
//   }
// }

// module "tx_node" {
//   source = "./modules/tx-node"
//   # variables
//   block_time                            = var.block_time
//   celo_env                              = var.celo_env
//   instance_type                         = var.instance_types["txnode"]
//   ethstats_host                         = var.ethstats_host
//   genesis_content_base64                = base64encode(data.http.genesis.body)
//   geth_exporter_docker_image_repository = var.geth_exporter_docker_image_repository
//   geth_exporter_docker_image_tag        = var.geth_exporter_docker_image_tag
//   geth_node_docker_image_repository     = var.geth_node_docker_image_repository
//   geth_node_docker_image_tag            = var.geth_node_docker_image_tag
//   geth_verbosity                        = var.geth_verbosity
//   in_memory_discovery_table             = var.in_memory_discovery_table
//   network_id                            = var.network_id
//   network_name                          = var.network_name
//   tx_node_count                         = var.tx_node_count
//   bootnodes_base64                      = base64encode(data.http.bootnodes.body)
// }

// module "proxy" {
//   source = "./modules/proxy"
//   # variables
//   block_time                            = var.block_time
//   celo_env                              = var.celo_env
//   instance_type                         = var.instance_types["proxy"]
//   ethstats_host                         = var.ethstats_host
//   genesis_content_base64                = base64encode(data.http.genesis.body)
//   geth_exporter_docker_image_repository = var.geth_exporter_docker_image_repository
//   geth_exporter_docker_image_tag        = var.geth_exporter_docker_image_tag
//   geth_node_docker_image_repository     = var.geth_node_docker_image_repository
//   geth_node_docker_image_tag            = var.geth_node_docker_image_tag
//   geth_verbosity                        = var.geth_verbosity
//   in_memory_discovery_table             = var.in_memory_discovery_table
//   istanbul_request_timeout_ms           = var.istanbul_request_timeout_ms
//   network_id                            = var.network_id
//   network_name                          = var.network_name
//   tx_node_count                         = var.tx_node_count
//   validator_count                       = var.validator_count
//   reset_geth_data                       = var.reset_geth_data

//   proxy_name                         = var.proxy_name
//   proxy_private_keys                 = var.proxy_private_keys
//   validator_signer_account_addresses = var.validator_signer_account_addresses
//   bootnodes_base64                   = base64encode(data.http.bootnodes.body)
// }

// module "validator" {
//   source = "./modules/validator"
//   # variables
//   block_time                            = var.block_time
//   celo_env                              = var.celo_env
//   instance_type                         = var.instance_types["validator"]
//   ethstats_host                         = var.ethstats_host
//   genesis_content_base64                = base64encode(data.http.genesis.body)
//   geth_exporter_docker_image_repository = var.geth_exporter_docker_image_repository
//   geth_exporter_docker_image_tag        = var.geth_exporter_docker_image_tag
//   geth_node_docker_image_repository     = var.geth_node_docker_image_repository
//   geth_node_docker_image_tag            = var.geth_node_docker_image_tag
//   geth_verbosity                        = var.geth_verbosity
//   in_memory_discovery_table             = var.in_memory_discovery_table
//   istanbul_request_timeout_ms           = var.istanbul_request_timeout_ms
//   network_id                            = var.network_id
//   network_name                          = var.network_name
//   tx_node_count                         = var.tx_node_count
//   validator_count                       = var.validator_count
//   reset_geth_data                       = var.reset_geth_data

//   validator_name                     = var.validator_name
//   validator_signer_account_addresses = var.validator_signer_account_addresses
//   validator_signer_account_passwords = var.validator_signer_account_passwords
//   validator_signer_private_keys      = var.validator_signer_private_keys
//   proxy_enodes                       = var.proxy_enodes
//   proxy_internal_ips                 = module.proxy.internal_ip_addresses
//   proxy_external_ips                 = module.proxy.external_ip_addresses
// }

// module "attestation-service" {
//   source = "./modules/attestation-service"
//   # Variables
//   celo_env                                    = var.celo_env
//   gcloud_region                               = var.gcloud_region
//   instance_type                               = var.instance_types["attestation_service"]
//   network_name                                = var.network_name
//   attestation_service_count                   = var.attestation_service_count
//   db_username                                 = var.attestation_service_db_username
//   db_password                                 = var.attestation_service_db_password
//   attestation_service_docker_image_repository = var.attestation_service_docker_image_repository
//   attestation_service_docker_image_tag        = var.attestation_service_docker_image_tag
//   account_address                             = var.attestation_signer_addresses
//   attestation_key                             = var.attestation_signer_private_keys
//   celo_provider                               = var.attestation_service_celo_provider != "" ? var.attestation_service_celo_provider : "http://${module.tx_node.internal_ip_addresses[0]}:8545"
//   sms_providers                               = var.attestation_service_sms_providers
//   nexmo_key                                   = var.attestation_service_nexmo_key
//   nexmo_secret                                = var.attestation_service_nexmo_secret
//   nexmo_blacklist                             = var.attestation_service_nexmo_blacklist
//   twilio_account_sid                          = var.attestation_service_twilio_account_sid
//   twilio_messaging_service_sid                = var.attestation_service_twilio_messaging_service_sid
//   twilio_auth_token                           = var.attestation_service_twilio_auth_token
//   twilio_blacklist                            = var.attestation_service_twilio_blacklist
// }
