{{- define "name" -}}
{{- .Values.environment.name -}}-oracle-rbac-{{- .index -}}
{{- end -}}

{{- define "oracle-pod-name" -}}
{{- .Values.environment.name -}}-oracle-{{- .index -}}
{{- end -}}
