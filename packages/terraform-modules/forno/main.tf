provider "google" {
  credentials = file(var.gcloud_credentials_path)
  project     = var.gcloud_project
  region      = "us-west1"
  zone        = "us-west1-a"
}

provider "google-beta" {
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
  required_providers {
    google      = "~> 3.38.0"
    google-beta = "~> 3.38.0"
  }
}

data "terraform_remote_state" "state" {
  backend = "gcs"
  config = {
    bucket = "celo_tf_state"
    prefix = "${var.celo_env}/forno"
  }
}

module "http_backends" {
  source = "./modules/backends"
  # variables
  backend_max_requests_per_second = var.backend_max_requests_per_second
  celo_env                        = var.celo_env
  context_info                    = var.context_info_http
  health_check_destination_port   = 6000
  type                            = "http"
}

module "ws_backends" {
  source = "./modules/backends"
  # variables
  backend_max_requests_per_second = var.backend_max_requests_per_second
  celo_env                        = var.celo_env
  context_info                    = var.context_info_ws
  health_check_destination_port   = 6001
  type                            = "ws"
  timeout_sec                     = 1200 # 20 minutes
}

resource "google_compute_global_address" "global_address" {
  name = "${var.celo_env}-forno-global-address"

  address_type = "EXTERNAL"
  ip_version   = "IPV4"
}

resource "google_compute_managed_ssl_certificate" "ssl_cert" {
  provider = google-beta

  name = "${var.celo_env}-forno-ssl-cert-${random_id.ssl_random_suffix.hex}"

  managed {
    domains = var.ssl_cert_domains
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "random_id" "ssl_random_suffix" {
  byte_length = 4
}

resource "google_compute_url_map" "url_map" {
  name            = "${var.celo_env}-forno-url-map"
  default_service = module.http_backends.backend_service_id

  host_rule {
    hosts        = ["*"]
    path_matcher = "${var.celo_env}-forno-path-matcher"
  }

  path_matcher {
    name            = "${var.celo_env}-forno-path-matcher"
    default_service = module.http_backends.backend_service_id

    path_rule {
      paths   = ["/ws"]
      service = module.ws_backends.backend_service_id
    }
  }
}

# This will route ingress traffic to the geographically closest backend
# whose utilization is not full.
# See https://cloud.google.com/load-balancing/docs/https#network-service-tiers_1
resource "google_compute_target_https_proxy" "target_https_proxy" {
  name             = "${var.celo_env}-forno-target-https-proxy"
  url_map          = google_compute_url_map.url_map.id
  ssl_certificates = [google_compute_managed_ssl_certificate.ssl_cert.id]
}

resource "google_compute_global_forwarding_rule" "forwarding_rule" {
  name = "${var.celo_env}-forno-forwarding-rule"

  target     = google_compute_target_https_proxy.target_https_proxy.id
  ip_address = google_compute_global_address.global_address.address
  port_range = "443"
}

# This allows GCP health check traffic AND traffic that is being sent from LBs
# to network endpoints
resource "google_compute_firewall" "allow-health-check" {
  name          = "${var.celo_env}-forno-health-check-firewall"
  direction     = "INGRESS"
  source_ranges = ["130.211.0.0/22", "35.191.0.0/16"]
  network       = var.vpc_network_name

  allow {
    protocol = "tcp"
    ports    = ["6000", "6001", "8545", "8546"]
  }
}
