@echo off

grep -v '#' sublocations.csv | deno run csv-to-json.ts --imply:recordType=location | deno run --allow-read locations-to-svg.ts >map.svg
