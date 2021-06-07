{{- define "name" -}}
{{- .Values.environment.name -}}-funder-rbac
{{- end -}}

{{- define "funder-pod-name" -}}
{{- .Values.environment.name -}}-funder-0
{{- end -}}
