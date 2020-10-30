{{- define "name" -}}
{{- .Values.environment.name -}}-komenci-rbac-{{- .index -}}
{{- end -}}

{{- define "komenci-pod-name" -}}
{{- .Values.environment.name -}}-relayer-{{- .index -}}
{{- end -}}
