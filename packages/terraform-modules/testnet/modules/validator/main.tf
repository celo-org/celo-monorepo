locals {
  attached_disk_name = "celo-data"
  name_prefix        = "${var.celo_env}-validator"
}

resource "google_compute_address" "validator" {
  name         = "${local.name_prefix}-address-${count.index}"
  address_type = "EXTERNAL"

  count = var.validator_count
}

resource "google_compute_instance" "validator" {
  name         = "${local.name_prefix}-${count.index}"
  machine_type = "n1-standard-1"

  count = var.validator_count

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
    network = var.network_name
    subnetwork = google_compute_subnetwork.validator.name
    # We want to make sure the first proxied_validator_count validators
    # are not reachable externally
    dynamic "access_config" {
      for_each = count.index < var.proxied_validator_count ? [0] : [0]
      content {
        nat_ip = google_compute_address.validator[count.index].address
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
      geth_node_docker_image_repository : var.geth_node_docker_image_repository,
      geth_node_docker_image_tag : var.geth_node_docker_image_tag,
      geth_verbosity : var.geth_verbosity,
      in_memory_discovery_table : var.in_memory_discovery_table,
      ip_address : google_compute_address.validator[count.index].address,
      istanbul_request_timeout_ms : var.istanbul_request_timeout_ms,
      max_peers : (var.validator_count + var.tx_node_count) * 2,
      network_id : var.network_id,
      proxied : count.index < var.proxied_validator_count,
      rid : count.index,
      sentry_ip_address : count.index < var.proxied_validator_count ? module.sentry.ip_addresses[count.index] : ""
      validator_name : "${local.name_prefix}-${count.index}",
      verification_pool_url : var.verification_pool_url
    }
  )

  service_account {
    email = var.gcloud_vm_service_account_email
    scopes = [
      "https://www.googleapis.com/auth/compute",
      "https://www.googleapis.com/auth/devstorage.read_only",
      "https://www.googleapis.com/auth/logging.write"
    ]
  }
}

resource "google_compute_disk" "validator" {
  name  = "${local.name_prefix}-disk-${count.index}"
  count = var.validator_count

  type = "pd-ssd"
  # in GB
  size                      = 10
  physical_block_size_bytes = 4096
}

resource "google_compute_subnetwork" "validator" {
  name          = "${local.name_prefix}-subnet"
  network       = var.network_name
  # Arbitrary IP range. This cannot overlap with existing subnetwork IP ranges
  # in the same network, so there can only be at most 1 VM testnet on a VPC network
  ip_cidr_range = "10.25.0.0/24"
  # to allow an internal instance to reach google API servers (metrics reporting, logs, etc)
  private_ip_google_access = true
}

# sentries

module "sentry" {
  source = "../full-node"
  # variable
  additional_geth_flags             = "--sentry"
  block_time                        = var.block_time
  bootnode_ip_address               = var.bootnode_ip_address
  celo_env                          = var.celo_env
  ethstats_host                     = var.ethstats_host
  gcloud_secrets_base_path          = var.gcloud_secrets_base_path
  gcloud_secrets_bucket             = var.gcloud_secrets_bucket
  gcloud_vm_service_account_email   = var.gcloud_vm_service_account_email
  genesis_content_base64            = var.genesis_content_base64
  geth_node_docker_image_repository = var.geth_node_docker_image_repository
  geth_node_docker_image_tag        = var.geth_node_docker_image_tag
  geth_verbosity                    = var.geth_verbosity
  in_memory_discovery_table         = var.in_memory_discovery_table
  name                              = "sentry"
  network_id                        = var.network_id
  network_name                      = var.network_name
  # NOTE this assumes only one sentry will be used
  node_count                        = var.proxied_validator_count
  verification_pool_url             = var.verification_pool_url
}
