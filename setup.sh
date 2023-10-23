#!/bin/bash
set -e

ask_for_api_key() {
  # exit with 0 if FORGE_API_KEY is already set
  [ -n "$FORGE_API_KEY" ] && return 0
  [ -f .env ] && echo "Add FORGE_API_KEY=apikey to your .env file" && return 0
  read -r -p "Enter your API key: " api_key
  echo "FORGE_API_KEY=$api_key" > .env
}

dl_gnark_cubic_circuit() {
  local circuit_archive_name="cubic.tar.gz"
  curl -L -o "circuits/$circuit_archive_name" "https://github.com/Sindri-Labs/forge-sample-data/raw/main/gnark/$circuit_archive_name"
}

dl_circuit_input_json() {
  local circuit_input_name="cubic_input.json"
  curl -o "circuits/$circuit_input_name" "https://raw.githubusercontent.com/Sindri-Labs/forge-sample-data/main/gnark/cubic/input.json"
}

main() {
  pnpm install
  touch .env
  ask_for_api_key
  [ ! -d "circuits/" ] &&  mkdir circuits/
  dl_gnark_cubic_circuit
  dl_circuit_input_json

}

main "$@"