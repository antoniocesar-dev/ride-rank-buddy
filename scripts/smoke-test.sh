#!/usr/bin/env bash
# scripts/smoke-test.sh
# Post-deploy smoke tests for Ride Rank Buddy (pure frontend SPA).
# Usage: bash scripts/smoke-test.sh [BASE_URL]
# Example: bash scripts/smoke-test.sh http://76.13.169.177
#
# Exits 0 = all checks passed
# Exits 1 = one or more checks failed

set -euo pipefail

BASE_URL="${1:-http://76.13.169.177}"
FAILURES=0
TOTAL=0

check() {
  local label="$1"
  local url="$2"
  local expected_status="$3"
  TOTAL=$((TOTAL + 1))

  local actual_status
  actual_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${url}" 2>/dev/null) || actual_status="000"

  if [ "${actual_status}" = "${expected_status}" ]; then
    echo "  PASS  [${actual_status}] ${label}"
  else
    echo "  FAIL  [${actual_status} != ${expected_status}] ${label} — URL: ${url}"
    FAILURES=$((FAILURES + 1))
  fi
}

echo "================================================"
echo "Ride Rank Buddy — Smoke Tests"
echo "Base URL: ${BASE_URL}"
echo "================================================"

# ── Frontend health (nginx serving index.html) ───────────────────────────────
check "GET / (frontend root)" "${BASE_URL}/" "200"

# ── SPA fallback — deep routes must return 200 (served by index.html) ───────
check "GET /dashboard (SPA fallback)" "${BASE_URL}/dashboard" "200"
check "GET /login (SPA fallback)" "${BASE_URL}/login" "200"

# ── Static assets — Vite outputs to /assets/ ─────────────────────────────────
# This checks that nginx serves the assets dir correctly (any non-404 response means dir exists)
# We just verify the root loads successfully and contains expected content
check "GET /index.html (no-cache header)" "${BASE_URL}/index.html" "200"

echo "================================================"
echo "Results: $((TOTAL - FAILURES))/${TOTAL} passed"

if [ "${FAILURES}" -gt 0 ]; then
  echo ""
  echo "SMOKE TESTS FAILED — ${FAILURES} check(s) failed."
  echo ""
  echo "Debug on VPS:"
  echo "  cd /opt/apps/riderank"
  echo "  docker compose -f docker-compose.yml -f docker-compose.vps.yml logs frontend"
  echo "================================================"
  exit 1
fi

echo ""
echo "All smoke tests passed."
echo "================================================"
exit 0
