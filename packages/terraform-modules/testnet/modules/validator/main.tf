# This module creates var.validator_count validators. The first
# local.proxied_validator_count validators are hidden behind externally facing
# proxies, and the rest are exposed to the external internet.

locals {
  attached_disk_name      = "celo-data"
  name_prefix             = "${var.celo_env}-validator"
  proxied_validator_count = length(var.proxies_per_validator)
}

resource "google_compute_address" "validator" {
  name         = "${local.name_prefix}-address-${count.index}"
  address_type = "EXTERNAL"

  # only create external addresses for validators that are not proxied
  count = var.validator_count - local.proxied_validator_count
}

resource "google_compute_address" "validator_internal" {
  name         = "${local.name_prefix}-internal-address-${count.index}"
  subnetwork   = google_compute_subnetwork.validator.self_link
  address_type = "INTERNAL"
  purpose      = "GCE_ENDPOINT"

  count = var.validator_count
}

resource "google_compute_instance" "validator" {
  name         = "${local.name_prefix}-${count.index}"
  machine_type = "n1-standard-2"

  count = var.validator_count

  tags = ["${var.celo_env}-node", "${var.celo_env}-validator"]

  allow_stopping_for_update = true

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-9"
    }
  }

  attached_disk {
    source      = google_compute_disk.validator[count.index].self_link
    device_name = local.attached_disk_name
  }

  network_interface {
    network    = var.network_name
    network_ip = google_compute_address.validator_internal[count.index].address
    subnetwork = google_compute_subnetwork.validator.name
    # We only want an access config for validators that will not be proxied
    dynamic "access_config" {
      for_each = count.index < local.proxied_validator_count ? [] : [0]
      content {
        nat_ip = google_compute_address.validator[count.index - local.proxied_validator_count].address
      }
    }
  }

  metadata_startup_script = templatefile(
    format("%s/startup.sh", path.module), {
      attached_disk_name : local.attached_disk_name,
      block_time : var.block_time,
      bootnode_ip_address : var.bootnode_ip_address,
      ethstats_host : var.ethstats_host,
      gcloud_secrets_base_path : var.gcloud_secrets_base_path,
      gcloud_secrets_bucket : var.gcloud_secrets_bucket,
      genesis_content_base64 : var.genesis_content_base64,
      geth_metrics : var.geth_metrics,
      geth_node_docker_image_repository : var.geth_node_docker_image_repository,
      geth_node_docker_image_tag : var.geth_node_docker_image_tag,
      geth_verbosity : var.geth_verbosity,
      in_memory_discovery_table : var.in_memory_discovery_table,
      ip_address : count.index < local.proxied_validator_count ? "" : google_compute_address.validator[count.index - local.proxied_validator_count].address,
      istanbul_request_timeout_ms : var.istanbul_request_timeout_ms,
      max_light_peers : 20,
      max_peers : 125,
      network_id : var.network_id,
      network_name : var.celo_env,
      proxied : count.index < length(var.proxies_per_validator),
      # proxied : var.proxies_per_validator[count.index] > 0 ? true : false,
      rid : count.index,
      # Searches for all proxies whose map key corresponds to this specific validator
      # by finding keys starting with "validator-${this validator index}"
      proxy_internal_ip_addresses : compact([for key in keys(module.proxy.internal_ip_addresses_map) : substr(key, 0, length(format("validator-%d", count.index))) == format("validator-%d", count.index) ? module.proxy.internal_ip_addresses_map[key] : ""]),
      proxy_external_ip_addresses : compact([for key in keys(module.proxy.ip_addresses_map) : substr(key, 0, length(format("validator-%d", count.index))) == format("validator-%d", count.index) ? module.proxy.ip_addresses_map[key] : ""]),
      validator_name : "${local.name_prefix}-${count.index}",
    }
  )

  service_account {
    email = var.gcloud_vm_service_account_email
    scopes = [
      "https://www.googleapis.com/auth/compute",
      "https://www.googleapis.com/auth/devstorage.read_only",
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring.write"
    ]
  }
}

resource "google_compute_disk" "validator" {
  name  = "${local.name_prefix}-disk-${count.index}"
  count = var.validator_count

  type = "pd-ssd"
  # in GB
  size                      = var.node_disk_size_gb
  physical_block_size_bytes = 4096
}

resource "google_compute_subnetwork" "validator" {
  name    = "${local.name_prefix}-subnet"
  network = var.network_name
  # Arbitrary IP range. This cannot overlap with existing subnetwork IP ranges
  # in the same network, so there can only be at most 1 VM testnet on a VPC network
  ip_cidr_range = "10.25.0.0/24"
  # to allow an internal instance to reach google API servers (metrics reporting, logs, etc)
  private_ip_google_access = true
}

# proxies

module "proxy" {
  source = "../full-node"
  # variables
  block_time                            = var.block_time
  bootnode_ip_address                   = var.bootnode_ip_address
  celo_env                              = var.celo_env
  ethstats_host                         = var.ethstats_host
  gcloud_secrets_base_path              = var.gcloud_secrets_base_path
  gcloud_secrets_bucket                 = var.gcloud_secrets_bucket
  gcloud_vm_service_account_email       = var.gcloud_vm_service_account_email
  genesis_content_base64                = var.genesis_content_base64
  geth_metrics                          = var.geth_metrics
  geth_node_docker_image_repository     = var.geth_node_docker_image_repository
  geth_node_docker_image_tag            = var.geth_node_docker_image_tag
  geth_verbosity                        = var.geth_verbosity
  in_memory_discovery_table             = var.in_memory_discovery_table
  instance_tags                         = ["${var.celo_env}-proxy"]
  max_peers                             = 200
  names                                 = flatten([for val_index in range(length(var.proxies_per_validator)) : [for proxy_index in range(var.proxies_per_validator[val_index]) : format("validator-%d-proxy-%d", val_index, proxy_index)]])
  network_id                            = var.network_id
  network_name                          = var.network_name
  node_disk_size_gb                     = var.node_disk_size_gb
  proxy                                 = true
}

# if there are no proxied validators, we don't have to worry about

resource "google_compute_firewall" "proxy_internal_ingress" {
  count = local.proxied_validator_count > 0 ? 1 : 0

  name    = "${local.name_prefix}-proxy-internal-ingress"
  network = var.network_name

  direction     = "INGRESS"
  source_ranges = ["10.0.0.0/8"]

  allow {
    protocol = "tcp"
    ports    = ["30503"]
  }

  allow {
    protocol = "udp"
    ports    = ["30503"]
  }
}

resource "google_compute_firewall" "proxy_internal_egress" {
  count = local.proxied_validator_count > 0 ? 1 : 0

  name    = "${local.name_prefix}-proxy-internal-egress"
  network = var.network_name

  direction          = "EGRESS"
  destination_ranges = ["10.0.0.0/8"]

  allow {
    protocol = "tcp"
    ports    = ["30503"]
  }

  allow {
    protocol = "udp"
    ports    = ["30503"]
  }
}
