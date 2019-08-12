resource "google_compute_address" "validator" {
  name = "${var.celo_env}-validator-address-${count.index}"
  address_type = "EXTERNAL"

  count = var.validator_count
}

resource "google_compute_instance" "validator" {
  name = "${var.celo_env}-validator-${count.index}"
  machine_type  = "n1-standard-1"

  count = var.validator_count

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
      nat_ip = google_compute_address.validator[count.index].address
    }
  }

  metadata_startup_script = templatefile(
    format("%s/startup.sh", path.module), {
      block_time: var.block_time,
      bootnode_ip_address: var.bootnode_ip_address,
      celotool_docker_image_repository: var.celotool_docker_image_repository,
      celotool_docker_image_tag: var.celotool_docker_image_tag,
      ethstats_host: var.ethstats_host,
      ethstats_websocket_secret: var.ethstats_websocket_secret,
      genesis_content_base64: var.genesis_content_base64,
      geth_account_secret: var.geth_account_secret,
      geth_node_docker_image_repository: var.geth_node_docker_image_repository,
      geth_node_docker_image_tag: var.geth_node_docker_image_tag,
      geth_verbosity: var.geth_verbosity,
      ip_address: google_compute_address.validator[count.index].address,
      max_peers: var.validator_count * 2,
      mnemonic: var.mnemonic,
      network_id: var.network_id,
      rid: count.index,
      validator_name: "${var.celo_env}-validator-${count.index}",
      verification_pool_url: var.verification_pool_url
    }
  )

  service_account {
    scopes = ["userinfo-email", "compute-ro", "storage-ro"]
  }
}
