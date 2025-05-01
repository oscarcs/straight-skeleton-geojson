import {MultiLineString, MultiPolygon} from "geojson";
import {Vector2d} from "./primitives/Vector2d";
import {EdgeResult} from "./EdgeResult";
import {Dictionary, List} from "./Utils";

export class StraightSkeleton {
	/**
	 * The edges of the straight skeleton
	 */ 
	public readonly edges: List<EdgeResult> = null;

	/**
	 * The distances from the original polygon to each point in the skeleton
	 */
	public readonly distances: Dictionary<Vector2d, number> = null;

	constructor(edges: List<EdgeResult>, distances: Dictionary<Vector2d, number>) {
		this.edges = edges;
		this.distances = distances;
	}

	/**
	 * Convert this skeleton to a MultiLineString.
	 * @returns MultiLineString
	 */
	public toMultiLineString(): MultiLineString {
		const coordinates = this.edges.map(edgeRes =>
			edgeRes.polygon.map(point => [point.x, point.y])
		);
		return { type: "MultiLineString", coordinates };
	}

	/**
	 * Convert this skeleton to a MultiPolygon.
	 * @returns MultiPolygon
	 */
	public toMultiPolygon(): MultiPolygon {
		const coordinates = this.edges.map(edgeRes => {
			const ring = edgeRes.polygon.map(point => [point.x, point.y]);
			if (ring.length > 0) {
				const first = ring[0];
				const last = ring[ring.length - 1];
				if (first[0] !== last[0] || first[1] !== last[1]) {
					ring.push(first);
				}
			}
			return [ring];
		});
		return { type: "MultiPolygon", coordinates };
	}

	/**
	 * Compute the offset polygons at distance d using the straight skeleton.
	 * @param d offset distance
	 * @returns MultiPolygon of offset shape(s)
	 */
	public offset(d: number): MultiPolygon {
		const segments: [[number, number], [number, number]][] = [];
		const PRECISION = 1e-8;
		const round = (v: number) => Math.round(v / PRECISION) * PRECISION;
		for (const edgeRes of this.edges) {
			const poly = edgeRes.polygon;
			const intersections: [number, number][] = [];
			const n = poly.length;
			for (let i = 0; i < n; i++) {
				const p1 = poly[i];
				const p2 = poly[(i + 1) % n];
				const d1 = this.distances.get(p1)!;
				const d2 = this.distances.get(p2)!;
				if ((d1 < d && d2 > d) || (d2 < d && d1 > d)) {
					const t = (d - d1) / (d2 - d1);
					const x = round(p1.x + t * (p2.x - p1.x));
					const y = round(p1.y + t * (p2.y - p1.y));
					intersections.push([x, y]);
				}
			}
			
			if (intersections.length === 2) {
				segments.push([intersections[0], intersections[1]]);
			}
		}

		// Chain segments into closed loops
		const segs = segments.slice();
		const loops: [number, number][][] = [];
		const equal = (a: [number, number], b: [number, number]) => a[0] === b[0] && a[1] === b[1];
		while (segs.length > 0) {
			const [start, next] = segs.shift()!;
			const loop: [number, number][] = [start, next];
			let extended = true;
			while (extended) {
				extended = false;
				const last = loop[loop.length - 1];
				
				for (let i = 0; i < segs.length; i++) {
					const [a, b] = segs[i];
					if (equal(a, last)) {
						loop.push(b);
						segs.splice(i, 1);
						extended = true;
						break;
					}
					else if (equal(b, last)) {
						loop.push(a);
						segs.splice(i, 1);
						extended = true;
						break;
					}
				}
			}
			
			// close loop if closed segment
			if (equal(loop[0], loop[loop.length - 1])) {
				// ensure closure
				const closedLoop = loop.slice();
				if (!equal(closedLoop[0], closedLoop[closedLoop.length - 1])) {
					closedLoop.push(closedLoop[0]);
				}
				loops.push(closedLoop);
			}
		}
		return { type: "MultiPolygon", coordinates: loops.map(l => [l]) };
	}
}