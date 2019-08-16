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
    prefix = "${var.celo_env}/state"
  }
}

resource "google_compute_network" "network" {
  name = "${var.celo_env}-network"
}

resource "google_compute_firewall" "ssh_firewall" {
  name = "${var.celo_env}-ssh-firewall"
  network = google_compute_network.network.name

  allow {
    protocol = "tcp"
    ports = ["22"]
  }
}

resource "google_compute_firewall" "geth_firewall" {
  name = "${var.celo_env}-geth-firewall"
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
  name = "${var.celo_env}-bootnode-firewall"
  network = google_compute_network.network.name

  allow {
    protocol = "udp"
    ports = ["30301"]
  }
}

module "bootnode" {
  source = "./modules/bootnode"
  # variables
  celo_env = var.celo_env
  gcloud_secrets_base_path = var.gcloud_secrets_base_path
  gcloud_secrets_bucket = var.gcloud_secrets_bucket
  gcloud_vm_service_account_email = var.gcloud_vm_service_account_email
  geth_bootnode_docker_image_repository = var.geth_bootnode_docker_image_repository
  geth_bootnode_docker_image_tag = var.geth_bootnode_docker_image_tag
  network_name = google_compute_network.network.name
}

module "validator" {
  source = "./modules/validator"
  # variables
  block_time = var.block_time
  bootnode_ip_address = module.bootnode.ip_address
  celo_env = var.celo_env
  ethstats_host = var.ethstats_host
  gcloud_secrets_base_path = var.gcloud_secrets_base_path
  gcloud_secrets_bucket = var.gcloud_secrets_bucket
  gcloud_vm_service_account_email = var.gcloud_vm_service_account_email
  genesis_content_base64 = var.genesis_content_base64
  geth_node_docker_image_repository = var.geth_node_docker_image_repository
  geth_node_docker_image_tag = var.geth_node_docker_image_tag
  geth_verbosity = var.geth_verbosity
  network_id = var.network_id
  network_name = google_compute_network.network.name
  validator_count = var.validator_count
  verification_pool_url = var.verification_pool_url
}
