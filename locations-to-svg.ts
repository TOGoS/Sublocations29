import { readLines } from 'https://deno.land/std@0.119.0/io/buffer.ts'

const locations = [];

interface Location {
	distance?: number;
	heading?: number;
	depth?: number;
	x: number; y:number; z:number;
	regionCode?: string;
	locationTypeCode?: string;
	note?: string;
}

function dempty(str:string|undefined) : string|undefined {
	return str == undefined || str.length == 0 ? undefined : str;
}

function parseLocation(record:any) : Location {
	if( record.distance == undefined ) {
		throw new Error("Record doesn't contain location info: "+JSON.stringify(record));
	}
	const distance = +record.distance;
	const heading = +record.heading;
	const depth = +record.depth;
	const horizontalDistance = Math.sqrt(distance*distance - depth*depth)
	const angle = heading * Math.PI / 180;
	return {
		distance,
		heading,
		depth,
		x:  Math.sin(angle) * horizontalDistance,
		y: -Math.cos(angle) * horizontalDistance,
		z: depth,
		regionCode: dempty(record.regionCode),
		locationTypeCode: dempty(record.locationTypeCode),
		note: dempty(record.note),
	}
}

let minX=Infinity, maxX=-Infinity, minY=Infinity, maxY=-Infinity;
const mapScale = 1/3;

for await( const line of readLines(Deno.stdin) ) {
	if( /^\s*(#|$)/.exec(line) ) continue;

	const record = JSON.parse(line);
	if( record.recordType == 'location' ) {
		const loc = parseLocation(record)
		locations.push(loc);
		if( loc.x < minX ) minX = loc.x;
		if( loc.x > maxX ) maxX = loc.x;
		if( loc.y < minY ) minY = loc.y;
		if( loc.y > maxY ) maxY = loc.y;
	}
}

minX -= 10;
minY -= 10;
maxX += 10;
maxY += 10;

function getLocationCssClass(loc:Location) {
	switch( loc.locationTypeCode ) {
	case 'E': return 'edge';
	case 'H': return 'home';
	case 'P': return 'portal';
	case 'N':
		if( loc.regionCode ) {
			return `entrance ${loc.regionCode.toLowerCase()}-biome`;
		} else {
			return 'entrance';
		}
	case 'B': case 'BB':
		if( loc.regionCode ) {
			return `biome ${loc.regionCode.toLowerCase()}-biome`;
		} else {
			return 'biome';
		}
	default: return 'poi';
	}
}

function getLocationDisplayInfo(loc:Location) {
	const cssClassName = getLocationCssClass(loc);
	return {
		cssClassName,
		circleRadius: (loc.locationTypeCode == 'B' || loc.locationTypeCode == 'BB') ? 20 : 5
	}
}

console.log(`
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
		viewBox="${minX} ${minY} ${maxX-minX} ${maxY-minY}"
		style="background: black"
		width="${(maxX-minX) * mapScale}" height="${(maxY-minY)*mapScale}">
	<style>
		${await Deno.readTextFile('./style.css')}
	</style>
`);

for( const loc of locations ) {
	const di = getLocationDisplayInfo(loc);
	console.log(`\t<circle class="${di.cssClassName}" r="${di.circleRadius}" cx="${loc.x.toFixed(0)}" cy="${loc.y.toFixed(0)}" title="${loc.distance}"/>`);
	if( loc.note != undefined ) {
		console.log(`\t<text class="${di.cssClassName}" x="${loc.x+10}" y="${loc.y}">${loc.note}</text>`)
	}
}
console.log("</svg>");
