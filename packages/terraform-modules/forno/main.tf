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
    google = "~> 3.38.0"
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

module "backends" {
  source = "./modules/backend"
  # variables
  backend_max_requests_per_second = var.backend_max_requests_per_second
  celo_env = var.celo_env
  context_rpc_service_network_endpoint_groups = var.context_rpc_service_network_endpoint_groups
  context_zones = var.context_zones
}

resource "google_compute_global_address" "global_address" {
  name = "${var.celo_env}-forno-global-address"

  address_type = "EXTERNAL"
  ip_version = "IPV4"
}

resource "google_compute_managed_ssl_certificate" "ssl_cert" {
  provider = google-beta

  name = "${var.celo_env}-forno-ssl-cert"

  managed {
    domains = var.domains
  }
}

resource "google_compute_url_map" "url_map" {
  name = "${var.celo_env}-forno-url-map"
  default_service = module.backends.backend_service_id

  # path_matcher {
  #   name = "all-paths"
  #
  #   path_rule {
  #     paths = ["/"]
  #
  #     route_action {
  #       dynamic "all_weighted_backend_services" {
  #         for_each = var.context_zones
  #
  #         weighted_backend_services {
  #           backend_service = module.backends.backend_ids[all_weighted_backend_services.key]
  #           weight = 100
  #         }
  #       }
  #     }
  #   }
  # }
}

# https://cloud.google.com/load-balancing/docs/https#network-service-tiers_1
resource "google_compute_target_https_proxy" "target_https_proxy" {
  name             = "${var.celo_env}-forno-target-https-proxy"
  url_map          = google_compute_url_map.url_map.id
  ssl_certificates = [google_compute_managed_ssl_certificate.ssl_cert.id]
}

resource "google_compute_global_forwarding_rule" "forwarding_rule" {
  name = "${var.celo_env}-forno-forwarding-rule"

  target = google_compute_target_https_proxy.target_https_proxy.id
  ip_address = google_compute_global_address.global_address.address
  port_range = "443"
}

resource "google_compute_firewall" "allow-health-check" {
  name = "${var.celo_env}-forno-health-check-firewall"
  direction = "INGRESS"
  source_ranges = ["130.211.0.0/22", "35.191.0.0/16"]
  network = var.vpc_network_name

  allow {
    protocol = "tcp"
    ports    = ["8545"]
  }
}

# https://cloud.google.com/load-balancing/docs/https#how-connections-work
# health check

# resource "google_compute_url_map" "url_map" {
#
# }
