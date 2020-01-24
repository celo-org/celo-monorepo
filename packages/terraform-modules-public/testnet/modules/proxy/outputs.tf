output internal_ip_addresses {
  value = google_compute_address.proxy_internal.*.address
}

output external_ip_addresses {
  value = google_compute_address.proxy.*.address
}
