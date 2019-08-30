locals {
  name_prefix = "${var.celo_env}-tx-node-lb"
}

resource "google_compute_address" "tx_node_lb" {
  name         = "${local.name_prefix}-address"
  address_type = "INTERNAL"
}

resource "google_compute_forwarding_rule" "tx_node_lb" {
  name = "${local.name_prefix}-fwd-rule"

  backend_service       = google_compute_region_backend_service.tx_node_lb.self_link
  ip_address            = google_compute_address.tx_node_lb.address
  load_balancing_scheme = "INTERNAL"
  network               = var.network_name
  ports                 = ["8545", "8546"]
}

resource "google_compute_region_backend_service" "tx_node_lb" {
  name = "${local.name_prefix}-service"

  protocol = "TCP"

  backend {
    group = google_compute_instance_group.tx_node_lb.self_link
  }

  health_checks = [
    google_compute_health_check.tx_node_lb.self_link
  ]
}

resource "google_compute_health_check" "tx_node_lb" {
  name = "${local.name_prefix}-health"

  tcp_health_check {
    port = 8545
  }
}

resource "google_compute_instance_group" "tx_node_lb" {
  name = "${local.name_prefix}-group"

  instances = var.tx_node_self_links
}
