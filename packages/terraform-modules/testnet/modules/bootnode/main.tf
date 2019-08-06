resource "google_compute_address" "bootnode" {
  name = "trevor-tf-test-bootnode-address"
  address_type = "EXTERNAL"
}

resource "google_compute_instance" "bootnode" {
  name          = "trevor-tf-test-bootnode"
  machine_type  = "n1-standard-1"

  tags = ["tag1", "tag2"]

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
      nat_ip = google_compute_address.bootnode.address
    }
  }

  metadata = {
    foo = "bar"
  }

  metadata_startup_script = templatefile(
    format("%s/startup.sh", path.module), {
      ip_address: google_compute_address.bootnode.address,
      mnemonic: var.mnemonic
    }
  )

  service_account {
    scopes = ["userinfo-email", "compute-ro", "storage-ro"]
  }
}
