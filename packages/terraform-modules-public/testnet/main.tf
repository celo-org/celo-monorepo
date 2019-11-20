provider "google" {
  project = var.gcloud_project
  region  = var.gcloud_region
  zone    = var.gcloud_zone
}

locals {
  firewall_target_tags_txnode    = ["${var.celo_env}-txnode"]
  firewall_target_tags_validator = ["${var.celo_env}-validator"]
  firewall_target_tags_proxy     = ["${var.celo_env}-proxy"]
  deploy_txnode_lb               = var.tx_node_count > 0 ? var.deploy_txnode_lb : false
}

# Dummy variable for network dependency
variable network_depends_on {
  type    = any
  default = null
}

data "google_compute_network" "celo" {
  name       = var.network_name
  depends_on = [var.network_depends_on]
}

data "google_compute_subnetwork" "celo" {
  name       = var.network_name
  region     = var.gcloud_region
  depends_on = [var.network_depends_on]
}

resource "google_compute_firewall" "ssh_firewall" {
  name    = "${var.celo_env}-ssh-firewall"
  network = var.network_name

  target_tags = concat(local.firewall_target_tags_txnode, local.firewall_target_tags_validator, local.firewall_target_tags_proxy)

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
}

resource "google_compute_firewall" "geth_firewall" {
  name    = "${var.celo_env}-geth-firewall"
  network = var.network_name

  target_tags = concat(local.firewall_target_tags_txnode, local.firewall_target_tags_validator, local.firewall_target_tags_proxy)

  allow {
    protocol = "tcp"
    ports    = ["30303"]
  }

  allow {
    protocol = "udp"
    ports    = ["30303"]
  }
}

resource "google_compute_firewall" "geth_metrics_firewall" {
  name    = "${var.celo_env}-geth-metrics-firewall"
  network = var.network_name

  target_tags = concat(local.firewall_target_tags_txnode, local.firewall_target_tags_validator, local.firewall_target_tags_proxy)

  # allow all IPs internal to the VPC
  source_ranges = [data.google_compute_subnetwork.celo.ip_cidr_range]

  allow {
    protocol = "tcp"
    ports    = ["9200"]
  }
}

resource "google_compute_firewall" "rpc_firewall" {
  name    = "${var.celo_env}-rpc-firewall"
  network = var.network_name

  target_tags = local.firewall_target_tags_proxy

  allow {
    protocol = "tcp"
    ports    = ["8545", "8546"]
  }
}

resource "google_compute_firewall" "proxy" {
  name    = "${var.celo_env}-proxy-firewall"
  network = var.network_name

  target_tags   = local.firewall_target_tags_proxy
  source_ranges = [data.google_compute_subnetwork.celo.ip_cidr_range]

  allow {
    protocol = "tcp"
    ports    = ["30301"]
  }

  allow {
    protocol = "udp"
    ports    = ["30301"]
  }
}

module "tx_node" {
  source = "./modules/tx-node"
  # variables
  block_time                            = var.block_time
  bootnode_ip_address                   = var.bootnode_ip_address
  celo_env                              = var.celo_env
  ethstats_host                         = var.ethstats_host
  genesis_content_base64                = var.genesis_content_base64
  geth_exporter_docker_image_repository = var.geth_exporter_docker_image_repository
  geth_exporter_docker_image_tag        = var.geth_exporter_docker_image_tag
  geth_node_docker_image_repository     = var.geth_node_docker_image_repository
  geth_node_docker_image_tag            = var.geth_node_docker_image_tag
  geth_verbosity                        = var.geth_verbosity
  in_memory_discovery_table             = var.in_memory_discovery_table
  network_id                            = var.network_id
  network_name                          = var.network_name
  tx_node_count                         = var.tx_node_count
  verification_pool_url                 = var.verification_pool_url

  txnode_account_addresses = var.txnode_account_addresses
  txnode_private_keys      = var.txnode_private_keys
  txnode_account_passwords = var.txnode_account_passwords
  bootnode_enode_address   = var.bootnode_enode_address
}

# used for access by blockscout
module "tx_node_lb" {
  source = "./modules/tx-node-load-balancer"
  # variables
  celo_env           = var.celo_env
  network_name       = var.network_name
  tx_node_self_links = module.tx_node.self_links
  deploy_txnode_lb   = local.deploy_txnode_lb
}

module "proxy" {
  source = "./modules/proxy"
  # variables
  block_time                            = var.block_time
  bootnode_ip_address                   = var.bootnode_ip_address
  celo_env                              = var.celo_env
  ethstats_host                         = var.ethstats_host
  genesis_content_base64                = var.genesis_content_base64
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
  verification_pool_url                 = var.verification_pool_url

  proxy_account_addresses     = var.proxy_account_addresses
  proxy_private_keys          = var.proxy_private_keys
  proxy_private_node_keys     = var.proxy_private_node_keys
  proxy_account_passwords     = var.proxy_account_passwords
  validator_account_addresses = var.validator_account_addresses
  bootnode_enode_address      = var.bootnode_enode_address
  static_nodes_base64         = var.static_nodes_base64
}

module "validator" {
  source = "./modules/validator"
  # variables
  block_time                            = var.block_time
  bootnode_ip_address                   = var.bootnode_ip_address
  celo_env                              = var.celo_env
  ethstats_host                         = var.ethstats_host
  genesis_content_base64                = var.genesis_content_base64
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
  verification_pool_url                 = var.verification_pool_url

  validator_account_addresses = var.validator_account_addresses
  validator_private_keys      = var.validator_private_keys
  validator_account_passwords = var.validator_account_passwords
  proxy_enodes                = var.proxy_enodes
  proxy_ips                   = module.proxy.internal_ip_addresses
  bootnode_enode_address      = var.bootnode_enode_address
  static_nodes_base64         = var.static_nodes_base64
}

module "attestation-service" {
  source = "./modules/attestation-service"
  # Variables
  celo_env                                    = var.celo_env
  gcloud_region                               = var.gcloud_region
  network_name                                = var.network_name
  enable_attestation_service                  = var.enable_attestation_service
  db_username                                 = var.attestation_service_db_username
  db_password                                 = var.attestation_service_db_password
  attestation_service_docker_image_repository = var.attestation_service_docker_image_repository
  attestation_service_docker_image_tag        = var.attestation_service_docker_image_tag
  attestation_key                             = var.attestation_service_attestation_key
  account_address                             = var.attestation_service_account_address
  celo_provider                               = var.attestation_service_celo_provider
  sms_providers                               = var.attestation_service_sms_providers
  nexmo_key                                   = var.attestation_service_nexmo_key
  nexmo_secret                                = var.attestation_service_nexmo_secret
  nexmo_blacklist                             = var.attestation_service_nexmo_blacklist
}

