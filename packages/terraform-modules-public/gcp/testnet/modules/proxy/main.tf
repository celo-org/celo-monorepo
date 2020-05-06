locals {
  attached_disk_name = "celo-data"
  name_prefix        = "${var.celo_env}-proxy"
}

resource "google_compute_address" "proxy" {
  name         = "${local.name_prefix}-address-${count.index}"
  address_type = "EXTERNAL"

  count = var.validator_count
}

resource "google_compute_address" "proxy_internal" {
  name         = "${local.name_prefix}-internal-address-${count.index}"
  address_type = "INTERNAL"
  purpose      = "GCE_ENDPOINT"

  count = var.validator_count
}

resource "google_compute_instance" "proxy" {
  name         = "${local.name_prefix}-${count.index}"
  machine_type = var.instance_type

  count = var.validator_count

  tags = ["${var.celo_env}-proxy"]

  allow_stopping_for_update = true

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-9"
    }
  }

  attached_disk {
    source      = google_compute_disk.proxy[count.index].self_link
    device_name = local.attached_disk_name
  }

  network_interface {
    network    = var.network_name
    network_ip = google_compute_address.proxy_internal[count.index].address
    access_config {
      nat_ip = google_compute_address.proxy[count.index].address
    }
  }

  metadata_startup_script = templatefile(
    format("%s/startup.sh", path.module), {
      attached_disk_name : local.attached_disk_name,
      block_time : var.block_time,
      ethstats_host : var.ethstats_host,
      genesis_content_base64 : var.genesis_content_base64,
      geth_exporter_docker_image_repository : var.geth_exporter_docker_image_repository,
      geth_exporter_docker_image_tag : var.geth_exporter_docker_image_tag,
      geth_node_docker_image_repository : var.geth_node_docker_image_repository,
      geth_node_docker_image_tag : var.geth_node_docker_image_tag,
      geth_verbosity : var.geth_verbosity,
      in_memory_discovery_table : var.in_memory_discovery_table,
      ip_address : google_compute_address.proxy[count.index].address,
      istanbul_request_timeout_ms : var.istanbul_request_timeout_ms,
      max_peers : var.proxy_max_peers,
      network_id : var.network_id,
      rid : count.index,
      proxy_name : var.proxy_name,
      proxy_private_key : var.proxy_private_keys[count.index],
      validator_account_address : var.validator_signer_account_addresses[count.index],
      bootnodes_base64 : var.bootnodes_base64,
      reset_geth_data : var.reset_geth_data
    }
  )
}

resource "google_compute_disk" "proxy" {
  name  = "${local.name_prefix}-disk-${count.index}"
  count = var.validator_count

  type = "pd-ssd"
  # in GB
  size                      = 100
  physical_block_size_bytes = 4096
}
