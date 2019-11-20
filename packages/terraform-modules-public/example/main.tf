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
  source             = "/Users/jcortejoso/Projects/Celo/celo-monorepo/packages/terraform-modules-public/testnet"
  network_depends_on = [google_compute_network.celo_network]

  gcloud_project = var.google["project"]
  gcloud_region  = var.google["region"]
  gcloud_zone    = var.google["zone"]
  network_name   = google_compute_network.celo_network.name
  celo_env       = "baklava"

  tx_node_count    = var.replicas["txnode"]
  validator_count  = var.replicas["validator"]
  deploy_txnode_lb = var.deploy_txnode_loadbalancer

  txnode_account_addresses = var.txnode_accounts["account_addresses"]
  txnode_private_keys      = var.txnode_accounts["private_keys"]
  txnode_account_passwords = var.txnode_accounts["account_passwords"]

  validator_account_addresses = var.validator_accounts["account_addresses"]
  validator_private_keys      = var.validator_accounts["private_keys"]
  validator_account_passwords = var.validator_accounts["account_passwords"]

  proxy_account_addresses = var.proxy_accounts["account_addresses"]
  proxy_private_keys      = var.proxy_accounts["private_keys"]
  proxy_private_node_keys = var.proxy_accounts["private_node_keys"]
  proxy_account_passwords = var.proxy_accounts["account_passwords"]
  proxy_enodes            = var.proxy_accounts["enodes"]

  verification_pool_url                 = var.verification_pool_url
  ethstats_host                         = var.ethstats_host
  in_memory_discovery_table             = var.in_memory_discovery_table
  geth_node_docker_image_repository     = var.geth_node_docker_image_repository
  geth_node_docker_image_tag            = var.geth_node_docker_image_tag
  network_id                            = var.network_id
  block_time                            = var.block_time
  istanbul_request_timeout_ms           = var.istanbul_request_timeout_ms
  geth_verbosity                        = var.geth_verbosity
  geth_exporter_docker_image_repository = var.geth_exporter_docker_image_repository
  geth_exporter_docker_image_tag        = var.geth_exporter_docker_image_tag
  bootnode_enode_address                = var.bootnode["enode"]
  bootnode_ip_address                   = var.bootnode["ip"]

  deploy_attestation_service                       = var.deploy_attestation_service
  attestation_service_db_username                  = var.attestation_service_db["username"]
  attestation_service_db_password                  = var.attestation_service_db["password"]
  attestation_service_docker_image_repository      = var.attestation_service_docker_image["repository"]
  attestation_service_docker_image_tag             = var.attestation_service_docker_image["tag"]
  attestation_service_account_address              = var.attestation_service_attestation_key["address"]
  attestation_service_attestation_key              = var.attestation_service_attestation_key["private_key"]
  attestation_service_sms_providers                = var.attestation_service_credentials["sms_providers"]
  attestation_service_nexmo_key                    = var.attestation_service_credentials["nexmo_key"]
  attestation_service_nexmo_secret                 = var.attestation_service_credentials["nexmo_secret"]
  attestation_service_nexmo_blacklist              = var.attestation_service_credentials["nexmo_blacklist"]
  attestation_service_twilio_account_sid           = var.attestation_service_credentials["twilio_account_sid"]
  attestation_service_twilio_messaging_service_sid = var.attestation_service_credentials["twilio_messaging_service_sid"]
  attestation_service_twilio_auth_token            = var.attestation_service_credentials["twilio_auth_token"]
  attestation_service_twilio_blacklist             = var.attestation_service_credentials["twilio_blacklist"]

  static_nodes_base64    = var.static_nodes
  genesis_content_base64 = var.genesis
}
