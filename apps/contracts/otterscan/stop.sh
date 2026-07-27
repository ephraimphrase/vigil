#!/usr/bin/env bash
set -euo pipefail

docker rm -f vigil-otterscan >/dev/null 2>&1 || true
echo "Otterscan stopped."
