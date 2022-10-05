@echo off

deno run csv-to-json.ts --imply:recordType=location <sublocations.csv | deno run locations-to-svg.ts >map.svg
