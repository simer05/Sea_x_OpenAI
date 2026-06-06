#!/bin/sh
set -e
cd "$(dirname "$0")/.."
git config core.hooksPath .githooks
chmod +x .githooks/commit-msg
echo "Git hooks enabled (.githooks/commit-msg)."
