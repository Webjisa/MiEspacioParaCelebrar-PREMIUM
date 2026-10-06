#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"

echo "[1] Secret scan"
if grep -RniE '(service_role|SUPABASE_SERVICE_ROLE|-----BEGIN .*PRIVATE KEY-----|xox[baprs]-|AKIA[0-9A-Z]{16})' "$root" --exclude='audit-local.sh'; then
  echo "Potential secret found" >&2; exit 1
fi

echo "[2] Duplicate CSS/JS references per HTML"
python3 - "$root" <<'PY'
import re, pathlib, sys
root=pathlib.Path(sys.argv[1])
for p in root.glob('*.html'):
    text=p.read_text(encoding='utf-8')
    css=re.findall(r'<link[^>]+href="([^"]+\.css)"', text)
    js=re.findall(r'<script[^>]+src="([^"]+\.js)"', text)
    if len(set(css)) != len(css): raise SystemExit(f'duplicate css in {p}')
    if len(set(js)) != len(js): raise SystemExit(f'duplicate js in {p}')
print('OK')
PY

echo "[3] Workflow location"
test -f "$root/.github/workflows/pages.yml"

echo "[4] Required starter files"
for f in index.html espacios.html espacio.html disponibilidad.html reservar.html seguimiento.html acceso.html area-privada.html admin.html css/main.css js/app.js js/calendar.js SECURITY.md; do test -f "$root/$f" || exit 1; done

echo "Audit baseline: PASS"
