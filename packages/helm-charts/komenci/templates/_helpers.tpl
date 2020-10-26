{{/*
The name of the deployment
*/}}
{{- define "name" -}}
{{- .Values.environment.name -}}-relayer
{{- end -}}

{{- define "komenci-onboarding-fullname" -}}
{{- .Values.environment.name -}}-onboarding
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
prometheus.io/port: "{{ .Values.relayer.metrics.prometheusPort }}"
{{- end -}}

{{/*
Label specific to the komenci relayer component
*/}}
{{- define "komenci-relayer-component-label" -}}
app.kubernetes.io/component: komenci-relayer
{{- end -}}

{{/*
Label specific to the komenci onboarding component
*/}}
{{- define "komenci-onboarding-component-label" -}}
app.kubernetes.io/component: komenci-onboarding
{{- end -}}

{{/*
The name of the azure identity binding for all relayers
*/}}
{{- define "azure-identity-binding-name" -}}
{{- with .dot -}}{{ template "name" . }}{{- end -}}-{{ .index }}-identity-binding
{{- end -}}

{{/*
The name of the azure identity for all oracles
*/}}
{{- define "azure-identity-name" -}}
{{- with .dot -}}{{ template "name" . }}{{- end -}}-{{ .index }}-identity
{{- end -}}