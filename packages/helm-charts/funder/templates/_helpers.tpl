{{/*
The name of the deployment
*/}}
{{- define "name" -}}
{{- .Values.environment.name -}}-funder
{{- end -}}

{{/*
Common labels that are recommended to be used by Helm and Kubernetes
*/}}
{{- define "labels" -}}
app.kubernetes.io/name: {{ template "name" . }}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version | replace "+" "_" }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end -}}

{{/*
Annotations to indicate to the prometheus server that this node should be scraped for metrics
*/}}
{{- define "metric-annotations" -}}
prometheus.io/scrape: "true"
prometheus.io/port: "{{ .Values.funder.metrics.prometheusPort }}"
{{- end -}}

{{/*
Label specific to funder service
*/}}
{{- define "funder-component-label" -}}
app.kubernetes.io/component: funder
{{- end -}}

{{/*
The name of the azure identity binding for the service
*/}}
{{- define "azure-identity-binding-name" -}}
{{- with .dot -}}{{ template "name" . }}{{- end -}}-0-identity-binding
{{- end -}}

{{/*
The name of the azure identity for the service
*/}}
{{- define "azure-identity-name" -}}
{{- with .dot -}}{{ template "name" . }}{{- end -}}-0-identity
{{- end -}}