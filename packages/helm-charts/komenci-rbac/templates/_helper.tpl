{{- define "name" -}}
{{- .Values.environment.name -}}-komenci-rbac-{{- .index -}}
{{- end -}}

{{- define "komenci-pod-name" -}}
{{- .Values.environment.name -}}-relayer-{{- .index -}}
{{- end -}}

{{- define "rewards-name" -}}
{{- .Values.environment.name -}}-komenci-rewards-rbac-{{- .index -}}
{{- end -}}

{{- define "komenci-rewards-pod-name" -}}
{{- .Values.environment.name -}}-rewards-relayer-{{- .index -}}
{{- end -}}