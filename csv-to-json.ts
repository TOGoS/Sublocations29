#!/bin/env deno

import { readCSVObjects } from "https://deno.land/x/csv/mod.ts";

async function streamCsvToJson(instream:Deno.Reader, outstream:Deno.Writer, impliedValues:{[k:string]:string}) {
	const TE = new TextEncoder;
	for await( const item of readCSVObjects(instream) ) {
		for( const k in item ) {
			if( (item[k]??'').startsWith('# ') ) {
				// Probably a comment line; fix CSV parser later
				continue;
			}
		}
		for( const k in impliedValues ) {
			item[k] = impliedValues[k];
		}
		outstream.write(TE.encode(JSON.stringify(item)+"\n"));
	}
}

if( import.meta.main ) {
	const impliedValues:{[k:string]:string} = {};

	for( const arg of Deno.args ) {
		let m : RegExpExecArray|null;
		if( (m = /^--imply:([^=]+)=(.*)$/.exec(arg)) != null ) {
			impliedValues[m[1]] = m[2];
		} else {
			console.error(`Unrecognized argument: '${arg}'`);
			Deno.exit(1);
		}
	}

	streamCsvToJson(Deno.stdin, Deno.stdout, impliedValues);
}
