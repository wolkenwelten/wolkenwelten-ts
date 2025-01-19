#!/usr/bin/env bash

cd "$(git rev-parse --show-toplevel)"

### Format code
npm run format
git add -A .

### Run all tests
# npm test
