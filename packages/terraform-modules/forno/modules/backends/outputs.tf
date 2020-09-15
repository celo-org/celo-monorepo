# map of context -> backend id
output backend_service_id {
  value = google_compute_backend_service.backend_service.id
}
