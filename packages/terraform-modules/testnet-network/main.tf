provider "google" {
  credentials = file(var.gcloud_credentials_path)
  project     = var.gcloud_project
  region      = "us-west1"
  zone        = "us-west1-a"
}

# For managing terraform state remotely
terraform {
  backend "gcs" {
    bucket = "celo_tf_state"
  }
}

data "terraform_remote_state" "state" {
  backend = "gcs"
  config = {
    bucket = "celo_tf_state"
    prefix = "${var.celo_env}/testnet-network"
  }
}

resource "google_compute_network" "testnet-network" {
  name = var.network_name
}
