#!/usr/bin/env bash
# BookPortfolio owns its frontend verification. The parent repository delegates
# to this entrypoint and does not choose package flags or test subsets.
set -euo pipefail

portfolio_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$portfolio_root"
npm run lint
npm test
npm run typecheck
npm run build
