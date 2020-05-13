provider "google" {
  project = var.google["project"]
  region  = var.google["region"]
  zone    = var.google["zone"]
}

# For managing terraform state remotely
terraform {
  backend "gcs" {
    bucket = "my_bucket"
    prefix = "my_tfs/celo"
  }
}

resource "google_project_service" "compute" {
  project                    = var.google["project"]
  service                    = "compute.googleapis.com"
  disable_dependent_services = true
  disable_on_destroy         = false
}

resource "google_project_service" "db" {
  project                    = var.google["project"]
  service                    = "sqladmin.googleapis.com"
  disable_dependent_services = true
  disable_on_destroy         = false
}

resource "google_compute_network" "celo_network" {
  name = var.network_name
  timeouts {
    delete = "15m"
  }
}

data "google_compute_subnetwork" "celo_subnetwork" {
  name       = google_compute_network.celo_network.name
  region     = var.google["region"]
  depends_on = [google_compute_network.celo_network]
}

resource "google_compute_router" "router" {
  name    = "baklava-celo-router"
  region  = data.google_compute_subnetwork.celo_subnetwork.region
  network = google_compute_network.celo_network.self_link

  bgp {
    asn = 64514
  }
}

resource "google_compute_router_nat" "nat" {
  name                               = "baklava-celo-router-nat"
  router                             = google_compute_router.router.name
  region                             = google_compute_router.router.region
  nat_ip_allocate_option             = "AUTO_ONLY"
  source_subnetwork_ip_ranges_to_nat = "ALL_SUBNETWORKS_ALL_IP_RANGES"

  log_config {
    enable = false
    filter = "ERRORS_ONLY"
  }
}

module "celo_cluster" {
  source             = "../testnet"
  network_depends_on = [google_compute_network.celo_network]

  gcloud_project = var.google["project"]
  gcloud_region  = var.google["region"]
  gcloud_zone    = var.google["zone"]
  network_name   = google_compute_network.celo_network.name
  celo_env       = var.celo_env
  instance_types = var.instance_types

  tx_node_count   = var.replicas["txnode"]
  validator_count = var.replicas["validator"]

  validator_signer_account_addresses = var.validator_signer_accounts["account_addresses"]
  validator_signer_private_keys      = var.validator_signer_accounts["private_keys"]
  validator_signer_account_passwords = var.validator_signer_accounts["account_passwords"]

  proxy_private_keys = var.proxy_accounts["private_keys"]
  proxy_enodes       = var.proxy_accounts["enodes"]

  validator_name = var.validator_name
  proxy_name     = var.proxy_name

  reset_geth_data = var.reset_geth_data

  ethstats_host                         = var.ethstats_host
  in_memory_discovery_table             = var.in_memory_discovery_table
  geth_node_docker_image_repository     = var.geth_node_docker_image["repository"]
  geth_node_docker_image_tag            = var.geth_node_docker_image["tag"]
  network_id                            = var.network_id
  block_time                            = var.block_time
  istanbul_request_timeout_ms           = var.istanbul_request_timeout_ms
  geth_verbosity                        = var.geth_verbosity
  geth_exporter_docker_image_repository = var.geth_exporter_docker_image["repository"]
  geth_exporter_docker_image_tag        = var.geth_exporter_docker_image["tag"]

  attestation_service_count                        = var.replicas["attestation_service"]
  attestation_service_db_username                  = var.attestation_service_db["username"]
  attestation_service_db_password                  = var.attestation_service_db["password"]
  attestation_service_docker_image_repository      = var.attestation_service_docker_image["repository"]
  attestation_service_docker_image_tag             = var.attestation_service_docker_image["tag"]
  attestation_signer_addresses                     = var.attestation_signer_accounts["account_addresses"]
  attestation_signer_private_keys                  = var.attestation_signer_accounts["private_keys"]
  attestation_service_sms_providers                = var.attestation_service_credentials["sms_providers"]
  attestation_service_nexmo_key                    = var.attestation_service_credentials["nexmo_key"]
  attestation_service_nexmo_secret                 = var.attestation_service_credentials["nexmo_secret"]
  attestation_service_nexmo_blacklist              = var.attestation_service_credentials["nexmo_blacklist"]
  attestation_service_twilio_account_sid           = var.attestation_service_credentials["twilio_account_sid"]
  attestation_service_twilio_messaging_service_sid = var.attestation_service_credentials["twilio_messaging_service_sid"]
  attestation_service_twilio_auth_token            = var.attestation_service_credentials["twilio_auth_token"]
  attestation_service_twilio_blacklist             = var.attestation_service_credentials["twilio_blacklist"]
}
