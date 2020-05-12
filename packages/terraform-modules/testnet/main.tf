provider "google" {
  credentials = file(var.gcloud_credentials_path)
  project     = var.gcloud_project
  region      = "us-west1"
  zone        = "us-west1-a"
}

provider "acme" {
  server_url = "https://acme-v02.api.letsencrypt.org/directory"
}

# For managing terraform state remotely
terraform {
  backend "gcs" {
    bucket = "celo_tf_state"
  }
  required_providers {
    google = "~> 2.16.0"
  }
}

data "terraform_remote_state" "state" {
  backend = "gcs"
  config = {
    bucket = "celo_tf_state"
    prefix = "${var.celo_env}/testnet"
  }
}

locals {
  target_tag_bootnode = "${var.celo_env}-bootnode"
  # any geth node (tx nodes & validators)
  target_tag_node = "${var.celo_env}-node"

  target_tag_proxy           = "${var.celo_env}-proxy"
  target_tag_tx_node         = "${var.celo_env}-tx-node"
  target_tag_tx_node_private = "${var.celo_env}-tx-node-private"
  target_tag_validator       = "${var.celo_env}-validator"

  target_tag_ssl = "${var.celo_env}-external-ssl"

  target_tags_all = [
    local.target_tag_bootnode,
    local.target_tag_node,
    local.target_tag_proxy,
    local.target_tag_ssl
  ]
}

data "google_compute_network" "network" {
  name = var.network_name
}

resource "google_compute_firewall" "ssh_firewall" {
  name    = "${var.celo_env}-ssh-firewall"
  network = data.google_compute_network.network.name

  target_tags = local.target_tags_all

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
}

resource "google_compute_firewall" "geth_firewall" {
  name    = "${var.celo_env}-geth-firewall"
  network = data.google_compute_network.network.name

  target_tags = [local.target_tag_node]

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
  network = data.google_compute_network.network.name

  target_tags = [local.target_tag_node]

  # allow all IPs internal to the VPC
  source_ranges = ["10.0.0.0/8"]

  allow {
    protocol = "tcp"
    ports    = ["9200"]
  }
}

resource "google_compute_firewall" "rpc_firewall_internal" {
  name    = "${var.celo_env}-rpc-firewall-internal"
  network = data.google_compute_network.network.name

  target_tags = [local.target_tag_tx_node_private]

  # allow all IPs internal to the VPC
  source_ranges = ["10.0.0.0/8"]

  allow {
    protocol = "tcp"
    ports    = ["8545", "8546"]
  }
}

resource "google_compute_firewall" "rpc_firewall" {
  name    = "${var.celo_env}-rpc-firewall"
  network = data.google_compute_network.network.name

  target_tags = [local.target_tag_tx_node]

  allow {
    protocol = "tcp"
    ports    = ["8545", "8546"]
  }
}

resource "google_compute_firewall" "bootnode_firewall" {
  name    = "${var.celo_env}-bootnode-firewall"
  network = data.google_compute_network.network.name

  target_tags = [local.target_tag_bootnode]

  allow {
    protocol = "udp"
    ports    = ["30301"]
  }
}

module "bootnode" {
  source = "./modules/bootnode"
  # variables
  celo_env                              = var.celo_env
  gcloud_secrets_base_path              = var.gcloud_secrets_base_path
  gcloud_secrets_bucket                 = var.gcloud_secrets_bucket
  gcloud_vm_service_account_email       = var.gcloud_vm_service_account_email
  geth_bootnode_docker_image_repository = var.geth_bootnode_docker_image_repository
  geth_bootnode_docker_image_tag        = var.geth_bootnode_docker_image_tag
  network_id                            = var.network_id
  network_name                          = data.google_compute_network.network.name
}

module "tx_node" {
  source = "./modules/full-node"
  # variables
  block_time                            = var.block_time
  bootnode_ip_address                   = module.bootnode.ip_address
  celo_env                              = var.celo_env
  ethstats_host                         = var.ethstats_host
  gcloud_secrets_base_path              = var.gcloud_secrets_base_path
  gcloud_secrets_bucket                 = var.gcloud_secrets_bucket
  gcloud_vm_service_account_email       = var.gcloud_vm_service_account_email
  genesis_content_base64                = var.genesis_content_base64
  geth_exporter_docker_image_repository = var.geth_exporter_docker_image_repository
  geth_exporter_docker_image_tag        = var.geth_exporter_docker_image_tag
  geth_node_docker_image_repository     = var.geth_node_docker_image_repository
  geth_node_docker_image_tag            = var.geth_node_docker_image_tag
  geth_verbosity                        = var.geth_verbosity
  in_memory_discovery_table             = var.in_memory_discovery_table
  instance_tags                         = [local.target_tag_tx_node]
  name                                  = "tx-node"
  network_id                            = var.network_id
  network_name                          = data.google_compute_network.network.name
  gcmode                                = "full"
  node_count                            = var.tx_node_count
  rpc_apis                              = "eth,net,web3"
}

module "tx_node_private" {
  source = "./modules/full-node"
  # variables
  block_time                            = var.block_time
  bootnode_ip_address                   = module.bootnode.ip_address
  celo_env                              = var.celo_env
  ethstats_host                         = var.ethstats_host
  gcloud_secrets_base_path              = var.gcloud_secrets_base_path
  gcloud_secrets_bucket                 = var.gcloud_secrets_bucket
  gcloud_vm_service_account_email       = var.gcloud_vm_service_account_email
  genesis_content_base64                = var.genesis_content_base64
  geth_exporter_docker_image_repository = var.geth_exporter_docker_image_repository
  geth_exporter_docker_image_tag        = var.geth_exporter_docker_image_tag
  geth_node_docker_image_repository     = var.geth_node_docker_image_repository
  geth_node_docker_image_tag            = var.geth_node_docker_image_tag
  geth_verbosity                        = var.geth_verbosity
  in_memory_discovery_table             = var.in_memory_discovery_table
  instance_tags                         = [local.target_tag_tx_node_private]
  name                                  = "tx-node-private"
  network_id                            = var.network_id
  network_name                          = data.google_compute_network.network.name
  gcmode                                = "archive"
  node_count                            = var.private_tx_node_count
  rpc_apis                              = "eth,net,web3,debug,txpool"
}

# used for access by blockscout
module "tx_node_lb" {
  source = "./modules/tx-node-load-balancer"
  # variables
  celo_env                        = var.celo_env
  dns_gcloud_project              = var.dns_gcloud_project
  dns_zone_name                   = var.dns_zone_name
  forno_host                      = var.forno_host
  gcloud_project                  = var.gcloud_project
  gcloud_vm_service_account_email = var.gcloud_vm_service_account_email
  letsencrypt_email               = var.letsencrypt_email
  network_name                    = data.google_compute_network.network.name
  private_tx_node_self_links      = module.tx_node_private.self_links
  tx_node_self_links              = module.tx_node.self_links
}

module "validator" {
  source = "./modules/validator"
  # variables
  block_time                            = var.block_time
  bootnode_ip_address                   = module.bootnode.ip_address
  celo_env                              = var.celo_env
  ethstats_host                         = var.ethstats_host
  gcloud_secrets_base_path              = var.gcloud_secrets_base_path
  gcloud_secrets_bucket                 = var.gcloud_secrets_bucket
  gcloud_vm_service_account_email       = var.gcloud_vm_service_account_email
  genesis_content_base64                = var.genesis_content_base64
  geth_exporter_docker_image_repository = var.geth_exporter_docker_image_repository
  geth_exporter_docker_image_tag        = var.geth_exporter_docker_image_tag
  geth_node_docker_image_repository     = var.geth_node_docker_image_repository
  geth_node_docker_image_tag            = var.geth_node_docker_image_tag
  geth_verbosity                        = var.geth_verbosity
  in_memory_discovery_table             = var.in_memory_discovery_table
  istanbul_request_timeout_ms           = var.istanbul_request_timeout_ms
  network_id                            = var.network_id
  network_name                          = data.google_compute_network.network.name
  proxied_validator_count               = var.proxied_validator_count
  validator_count                       = var.validator_count
}
