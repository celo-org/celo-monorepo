resource "google_compute_health_check" "http_health_check" {
  name = "${var.celo_env}-forno-http-health-check-${var.type}"

  http_health_check {
    port = var.health_check_destination_port
    # For NetworkEndpointGroup, the port specified for each network endpoint is used for health checking
    port_specification = "USE_FIXED_PORT"
  }
}

# This is a reference to the ClusterIP RPC service inside this region's k8s cluster.
# We get the NEG for each context.
data "google_compute_network_endpoint_group" "rpc_service_network_endpoint_group" {
  name = each.value.rpc_service_network_endpoint_group_name
  zone = each.value.zone

  for_each = var.context_info
}

# A backend that can route traffic to all of the context NEGs.
resource "google_compute_backend_service" "backend_service" {
  name = "${var.celo_env}-forno-backend-service-${var.type}"

  health_checks = [google_compute_health_check.http_health_check.self_link]
  timeout_sec   = var.timeout_sec

  custom_response_headers = [
    "Access-Control-Allow-Origin: *",
    "Access-Control-Allow-Methods: GET, POST, OPTIONS",
    "Access-Control-Allow-Headers: DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range",
    "Access-Control-Expose-Headers: Content-Length,Content-Range"
  ]

  dynamic "backend" {
    for_each = var.context_info
    content {
      balancing_mode = "RATE"
      max_rate       = var.backend_max_requests_per_second
      group          = data.google_compute_network_endpoint_group.rpc_service_network_endpoint_group[backend.key].self_link
    }
  }
}
