provider "google" {
  project = var.google["project"]
  region  = var.google["region"]
  zone    = var.google["zone"]
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
  name    = "${var.celo_env}-celo-router"
  region  = data.google_compute_subnetwork.celo_subnetwork.region
  network = google_compute_network.celo_network.self_link

  bgp {
    asn = 64514
  }
}

resource "google_compute_router_nat" "nat" {
  name                               = "${var.celo_env}-celo-router-nat"
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

  gcloud_project          = var.google["project"]
  gcloud_region           = var.google["region"]
  gcloud_zone             = var.google["zone"]
  network_name            = google_compute_network.celo_network.name
  celo_env                = var.celo_env
  instance_types          = var.instance_types
  service_account_scopes  = var.service_account_scopes

  stackdriver_logging_exclusions = var.stackdriver_logging_exclusions
  stackdriver_logging_metrics    = var.stackdriver_logging_metrics
  

  tx_node_count   = var.replicas["txnode"]
  validator_count = var.replicas["validator"]

  validator_signer_account_addresses = var.validator_signer_accounts["account_addresses"]
  validator_signer_private_keys      = var.validator_signer_accounts["private_keys"]
  validator_signer_account_passwords = var.validator_signer_accounts["account_passwords"]
  validator_release_gold_addresses   = var.validator_signer_accounts["release_gold_addresses"]

  proxy_private_keys = var.proxy_accounts["private_keys"]
  proxy_addresses      = var.proxy_accounts["account_addresses"]
  proxy_enodes       = var.proxy_accounts["enodes"]
  proxy_account_passwords = var.proxy_accounts["account_passwords"]

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
  attestation_signer_account_passwords             = var.attestation_signer_accounts["account_passwords"]
  attestation_service_sms_providers                = var.attestation_service_credentials["sms_providers"]
  attestation_service_nexmo_key                    = var.attestation_service_credentials["nexmo_key"]
  attestation_service_nexmo_secret                 = var.attestation_service_credentials["nexmo_secret"]
  attestation_service_nexmo_blacklist              = var.attestation_service_credentials["nexmo_blacklist"]
  attestation_service_twilio_account_sid           = var.attestation_service_credentials["twilio_account_sid"]
  attestation_service_twilio_messaging_service_sid = var.attestation_service_credentials["twilio_messaging_service_sid"]
  attestation_service_twilio_auth_token            = var.attestation_service_credentials["twilio_auth_token"]
  attestation_service_twilio_blacklist             = var.attestation_service_credentials["twilio_blacklist"]
}

resource "google_logging_project_exclusion" "logging_exclusion" {
  for_each = var.stackdriver_logging_exclusions
  
  name            = each.key                    #maybe make this a random_id to ensure no naming conflicts
  description     = each.value["description"]
  filter          = each.value["filter"]
}

resource "random_id" "stackdriver_logging_exclusions" {
  for_each = var.stackdriver_logging_exclusions
    byte_length = 4
}

resource "random_id" "stackdriver_logging_metrics" {
  for_each = var.stackdriver_logging_metrics
    byte_length = 4
}

resource "google_logging_metric" "logging_metric" {
  for_each = var.stackdriver_logging_metrics
    name        = each.key
    description = each.value["description"]
    filter = each.value["filter"]
    metric_descriptor {
      metric_kind  = "DELTA"
      value_type   = "INT64"
      display_name = each.value["description"]
    }
}

resource "google_logging_metric" "distribution_blocks_ingested" {
  name   = "tf_eth_blocks_ingested"
  description = "Ethereum blocks ingested"
  filter = "resource.type=\"gce_instance\" AND \"Imported new chain segment\""
  metric_descriptor {
    metric_kind = "DELTA"
    value_type  = "DISTRIBUTION"
    unit        = "blocks"
    display_name = "Blocks Ingested"
  }
  value_extractor = "REGEXP_EXTRACT(jsonPayload.message, \"\\\"blocks\\\":(\\\\d+)\")"
  bucket_options {
    explicit_buckets {
      bounds = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,40,60,80,100,120,140,160,180,200,400,500,600,700,800,900,1000,1200,1400,1600,1800,2000,2200,2400,2600,2800,3000,3500,4000,5000]
    }
  }
}

resource "google_storage_bucket" "chaindata_bucket" {
  name = "${var.google["project"]}-chaindata"
  location = "US"

  lifecycle_rule {
    condition {
      num_newer_versions = 2
    }
    action {
      type = "Delete"
    }
  }

  versioning {
      enabled = true
    }
}

resource "google_storage_bucket_iam_binding" "chaindata_binding_write" {
  bucket = "${var.google["project"]}-chaindata"
  role = "roles/storage.objectCreator"
  members = [
    "serviceAccount:${var.GCP_DEFAULT_SERVICE_ACCOUNT}",
  ]
}

resource "google_storage_bucket_iam_binding" "chaindata_binding_read" {
  bucket = "${var.google["project"]}-chaindata"
  role = "roles/storage.objectViewer"
  members = [
    "serviceAccount:${var.GCP_DEFAULT_SERVICE_ACCOUNT}",
  ]
}

resource "google_storage_bucket" "chaindata_rsync_bucket" {
  name = "${var.google["project"]}-chaindata-rsync"
  location = "US"

}

resource "google_storage_bucket_iam_binding" "chaindata_rsync_binding_write" {
  bucket = "${var.google["project"]}-chaindata-rsync"
  role = "roles/storage.objectCreator"
  members = [
    "serviceAccount:${var.GCP_DEFAULT_SERVICE_ACCOUNT}",
  ]
}

resource "google_storage_bucket_iam_binding" "chaindata_rsync_binding_read" {
  bucket = "${var.google["project"]}-chaindata-rsync"
  role = "roles/storage.objectViewer"
  members = [
    "serviceAccount:${var.GCP_DEFAULT_SERVICE_ACCOUNT}",
  ]
}

#resource "google_storage_bucket" "public_www_bucket" {
#  name = var.public_www_fqdn
#  location = "US"
#  force_destroy = true
#
#  website {
#    main_page_suffix = "index.html"
#    not_found_page   = "404.html"
#  }
#  cors {
#    origin          = ["https://${var.public_www_fqdn}"]
#    method          = ["GET", "HEAD"]
#    response_header = ["*"]
#    max_age_seconds = 3600
#  }
#}

#resource "google_storage_bucket_iam_binding" "public_www_binding_read" {
#  bucket = var.public_www_fqdn
#  role = "roles/storage.objectViewer"
#  members = [
#    "allUsers"
#  ]
#}