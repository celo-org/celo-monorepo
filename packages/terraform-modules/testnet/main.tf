provider "google" {
  credentials = file("/Users/trevor/.gcloud/service-accounts/celo-testnet-69a4cd9692dd.json")
  project     = "celo-testnet"
  region      = "us-west1"
  zone        = "us-west1-a"
}

# For managing terraform state remotely
terraform {
  backend "gcs" {
    bucket = "celo_tf_state"
    prefix = "trevor-testing/state"
  }
}

resource "google_compute_network" "network" {
  name = "trevor-tf-test"
}

resource "google_compute_firewall" "ssh_firewall" {
  name = "trevor-tf-test-ssh-firewall"
  network = google_compute_network.network.name

  allow {
    protocol = "tcp"
    ports = ["22"]
  }
}

resource "google_compute_firewall" "geth_firewall" {
  name = "trevor-tf-test-geth-firewall"
  network = google_compute_network.network.name

  allow {
    protocol = "tcp"
    ports = ["30303"]
  }

  allow {
    protocol = "udp"
    ports = ["30303"]
  }
}

resource "google_compute_firewall" "bootnode_firewall" {
  name = "trevor-tf-test-bootnode-firewall"
  network = google_compute_network.network.name

  allow {
    protocol = "udp"
    ports = ["30301"]
  }
}

module "bootnode" {
  source = "./modules/bootnode"
  # variables
  mnemonic = var.mnemonic
  network_name = google_compute_network.network.name
}

module "validator" {
  source = "./modules/validator"
  # variables
  block_time = var.block_time
  bootnode_ip_address = module.bootnode.ip_address
  celotool_docker_image_repository = var.celotool_docker_image_repository
  celotool_docker_image_tag = var.celotool_docker_image_tag
  genesis_content_base64 = var.genesis_content_base64
  geth_account_secret = var.validator_geth_account_secret
  geth_node_docker_image_repository = var.geth_node_docker_image_repository
  geth_node_docker_image_tag = var.geth_node_docker_image_tag
  geth_verbosity = var.geth_verbosity
  mnemonic = var.mnemonic
  network_id = var.network_id
  network_name = google_compute_network.network.name
  validator_count = var.validator_count
  verification_pool_url = var.verification_pool_url
}
