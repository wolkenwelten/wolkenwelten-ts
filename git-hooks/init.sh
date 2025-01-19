#!/usr/bin/env bash

cd "$(git rev-parse --show-toplevel)"
if [ ! -d ".git" ]; then
  echo "Can't find repo, aborting."
  exit 1
fi

ln -s "$(pwd)/git-hooks/pre-commit.sh" "$(pwd)/.git/hooks/pre-commit"
