import {MultiLineString, MultiPolygon} from "geojson";
import {Vector2d} from "./primitives/Vector2d";
import {EdgeResult} from "./EdgeResult";
import {Dictionary, List} from "./Utils";

export class StraightSkeleton {
	public readonly edges: List<EdgeResult> = null;
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
	 * Compute the offset polygon(s) at distance d using the straight skeleton.
	 * @param d offset distance
	 * @returns MultiPolygon of offset shape(s)
	 */
	public offset(d: number): MultiPolygon {
		const coords: number[][][][] = [];
		for (const edgeRes of this.edges) {
			const poly = edgeRes.polygon;
			const ring: number[][] = [];
			for (let i = 0; i < poly.count; i++) {
				const p1 = poly[i];
				const p2 = poly[(i + 1) % poly.count];
				const d1 = this.distances.get(p1) ?? 0;
				const d2 = this.distances.get(p2) ?? 0;
				// include first point if at or beyond offset
				if (d1 >= d) {
					ring.push([p1.x, p1.y]);
				}
				// check crossing between p1 and p2
				if ((d1 >= d) !== (d2 >= d) && d2 !== d1) {
					const t = (d - d1) / (d2 - d1);
					const x = p1.x + (p2.x - p1.x) * t;
					const y = p1.y + (p2.y - p1.y) * t;
					ring.push([x, y]);
				}
			}
			if (ring.length > 2) {
				// close ring
				const first = ring[0];
				const last = ring[ring.length - 1];
				if (first[0] !== last[0] || first[1] !== last[1]) {
					ring.push(first);
				}
				coords.push([ring]);
			}
		}
		return { type: "MultiPolygon", coordinates: coords };
	}
}