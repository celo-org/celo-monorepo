provider "google" {
  credentials = file(var.gcloud_credentials_path)
  project     = var.gcloud_project
  region      = "us-west1"
  zone        = "us-west1-a"
}

# For managing terraform state remotely
terraform {
  backend "gcs" {
    bucket = "celo_tf_state"
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
  firewall_target_tags_bootnode = ["${var.celo_env}-bootnode"]
  firewall_target_tags_node = ["${var.celo_env}-node"]
}

data "google_compute_network" "network" {
  name = var.network_name
}

resource "google_compute_firewall" "ssh_firewall" {
  name    = "${var.celo_env}-ssh-firewall"
  network = data.google_compute_network.network.name

  target_tags = concat(local.firewall_target_tags_bootnode, local.firewall_target_tags_node)

  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
}

resource "google_compute_firewall" "geth_firewall" {
  name    = "${var.celo_env}-geth-firewall"
  network = data.google_compute_network.network.name

  target_tags = local.firewall_target_tags_node

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

  target_tags = local.firewall_target_tags_node

  # allow all IPs internal to the VPC
  source_ranges = ["10.0.0.0/8"]

  allow {
    protocol = "tcp"
    ports    = ["9200"]
  }
}

resource "google_compute_firewall" "rpc_firewall" {
  name    = "${var.celo_env}-rpc-firewall"
  network = data.google_compute_network.network.name

  target_tags = local.firewall_target_tags_node

  allow {
    protocol = "tcp"
    ports    = ["8545", "8546"]
  }
}

resource "google_compute_firewall" "bootnode_firewall" {
  name    = "${var.celo_env}-bootnode-firewall"
  network = data.google_compute_network.network.name

  target_tags = local.firewall_target_tags_bootnode

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
  source = "./modules/tx-node"
  # variables
  block_time                        = var.block_time
  bootnode_ip_address               = module.bootnode.ip_address
  celo_env                          = var.celo_env
  ethstats_host                     = var.ethstats_host
  gcloud_secrets_base_path          = var.gcloud_secrets_base_path
  gcloud_secrets_bucket             = var.gcloud_secrets_bucket
  gcloud_vm_service_account_email   = var.gcloud_vm_service_account_email
  genesis_content_base64            = var.genesis_content_base64
  geth_exporter_docker_image_repository = var.geth_exporter_docker_image_repository
  geth_exporter_docker_image_tag    = var.geth_exporter_docker_image_tag
  geth_node_docker_image_repository = var.geth_node_docker_image_repository
  geth_node_docker_image_tag        = var.geth_node_docker_image_tag
  geth_verbosity                    = var.geth_verbosity
  in_memory_discovery_table         = var.in_memory_discovery_table
  network_id                        = var.network_id
  network_name                      = data.google_compute_network.network.name
  tx_node_count                     = var.tx_node_count
}

# used for access by blockscout
module "tx_node_lb" {
  source = "./modules/tx-node-load-balancer"
  # variables
  celo_env           = var.celo_env
  network_name       = data.google_compute_network.network.name
  tx_node_self_links = module.tx_node.self_links
}

module "validator" {
  source = "./modules/validator"
  # variables
  block_time                        = var.block_time
  bootnode_ip_address               = module.bootnode.ip_address
  celo_env                          = var.celo_env
  ethstats_host                     = var.ethstats_host
  gcloud_secrets_base_path          = var.gcloud_secrets_base_path
  gcloud_secrets_bucket             = var.gcloud_secrets_bucket
  gcloud_vm_service_account_email   = var.gcloud_vm_service_account_email
  genesis_content_base64            = var.genesis_content_base64
  geth_exporter_docker_image_repository = var.geth_exporter_docker_image_repository
  geth_exporter_docker_image_tag    = var.geth_exporter_docker_image_tag
  geth_node_docker_image_repository = var.geth_node_docker_image_repository
  geth_node_docker_image_tag        = var.geth_node_docker_image_tag
  geth_verbosity                    = var.geth_verbosity
  in_memory_discovery_table         = var.in_memory_discovery_table
  istanbul_request_timeout_ms       = var.istanbul_request_timeout_ms
  network_id                        = var.network_id
  network_name                      = data.google_compute_network.network.name
  tx_node_count                     = var.tx_node_count
  validator_count                   = var.validator_count
}
