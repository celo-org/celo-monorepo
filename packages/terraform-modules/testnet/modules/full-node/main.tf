locals {
  attached_disk_name = "celo-data"
  name_prefix        = "${var.celo_env}-${var.name}"
  # generate names using `var.name` if `var.names` isn't set
  names = length(var.names) > 0 ? var.names : [for node_index in range(var.node_count) : "${var.name}-${node_index}"]
}

resource "google_compute_address" "full_node" {
  name         = "${var.celo_env}-${each.key}-address-${random_id.full_node[each.key].hex}"
  address_type = "EXTERNAL"

  for_each = local.names

  lifecycle {
    create_before_destroy = true
  }
}

resource "google_compute_instance" "full_node" {
  name         = "${var.celo_env}-${each.key}-${random_id.full_node[each.key].hex}"
  machine_type = "n1-standard-2"

  for_each = local.names

  tags = concat(["${var.celo_env}-node"], var.instance_tags)

  allow_stopping_for_update = true

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-9"
    }
  }

  attached_disk {
    source      = google_compute_disk.full_node[each.key].self_link
    device_name = local.attached_disk_name
  }

  network_interface {
    network = var.network_name
    access_config {
      nat_ip = google_compute_address.full_node[each.key].address
    }
  }

  metadata_startup_script = templatefile(
    format("%s/startup.sh", path.module), {
      additional_geth_flags : var.additional_geth_flags,
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
      ip_address : google_compute_address.full_node[each.key].address,
      max_light_peers : var.max_light_peers,
      max_peers : var.max_peers,
      name : each.key,
      network_id : var.network_id,
      network_name : var.celo_env,
      gcmode: var.gcmode,
      node_name : "${var.celo_env}-${each.key}",
      proxy : var.proxy,
      rid : each.key,
      rpc_apis : var.rpc_apis,
    }
  )

  service_account {
    email = var.gcloud_vm_service_account_email
    scopes = [
      "https://www.googleapis.com/auth/devstorage.read_only",
      "https://www.googleapis.com/auth/logging.write",
      "https://www.googleapis.com/auth/monitoring.write"
    ]
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "google_compute_disk" "full_node" {
  name = "${var.celo_env}-${each.key}-disk-${random_id.full_node_disk[each.key].hex}"

  for_each = local.names

  type = "pd-ssd"
  # in GB
  size                      = var.node_disk_size_gb
  physical_block_size_bytes = 4096

  lifecycle {
    create_before_destroy = true
  }
}

resource "random_id" "full_node" {
  for_each = local.names

  byte_length = 8
}

# Separate random id so that updating the ID of the instance doesn't force a new disk
resource "random_id" "full_node_disk" {
  for_each = local.names

  byte_length = 8
}
