locals {
  name_prefix = "${var.celo_env}-tx-node"
}

resource "google_compute_address" "tx_node" {
  name         = "${local.name_prefix}-address-${count.index}"
  address_type = "EXTERNAL"

  count = var.tx_node_count
}

resource "google_compute_instance" "tx_node" {
  name         = "${local.name_prefix}-${count.index}"
  machine_type = "n1-standard-1"

  count = var.tx_node_count

  boot_disk {
    initialize_params {
      image = "debian-cloud/debian-9"
    }
  }

  scratch_disk {

  }

  network_interface {
    network = var.network_name
    access_config {
      nat_ip = google_compute_address.tx_node[count.index].address
    }
  }

  metadata_startup_script = templatefile(
    format("%s/startup.sh", path.module), {
      block_time : var.block_time,
      bootnode_ip_address : var.bootnode_ip_address,
      ethstats_host : var.ethstats_host,
      gcloud_secrets_base_path : var.gcloud_secrets_base_path,
      gcloud_secrets_bucket : var.gcloud_secrets_bucket,
      genesis_content_base64 : var.genesis_content_base64,
      geth_node_docker_image_repository : var.geth_node_docker_image_repository,
      geth_node_docker_image_tag : var.geth_node_docker_image_tag,
      geth_verbosity : var.geth_verbosity,
      ip_address : google_compute_address.tx_node[count.index].address,
      max_peers : var.tx_node_count * 2,
      network_id : var.network_id,
      rid : count.index,
      tx_node_name : "${var.celo_env}-tx-node-${count.index}",
      verification_pool_url : var.verification_pool_url
    }
  )

  service_account {
    email  = var.gcloud_vm_service_account_email
    scopes = ["storage-ro"]
  }
}
