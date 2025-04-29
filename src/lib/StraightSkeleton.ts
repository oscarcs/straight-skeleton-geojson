import {MultiLineString, MultiPolygon} from "geojson";
import {Vector2d} from "./primitives/Vector2d";
import {EdgeResult} from "./EdgeResult";
import {Dictionary, List} from "./Utils";
import {Edge} from "./circular/Edge";

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
	 * Compute the offset at distance d using the straight skeleton.
	 * @param d offset distance
	 * @returns MultiPolygon of offset shape(s)
	 */
	public offset(d: number): MultiPolygon {
		const intersectionMap = new Map<Edge, [number, number]>();
		for (const edgeRes of this.edges) {
			const pts = edgeRes.polygon;
			for (let i = 0; i < pts.length - 1; i++) {
				const p1 = pts[i];
				const p2 = pts[i + 1];
				const d1 = this.distances.get(p1);
				const d2 = this.distances.get(p2);
				
				if (d1 === undefined || d2 === undefined) continue;
				
				if ((d1 - d) * (d2 - d) <= 0 && d1 !== d2) {
					const t = (d - d1) / (d2 - d1);
					const x = p1.x + (p2.x - p1.x) * t;
					const y = p1.y + (p2.y - p1.y) * t;
					intersectionMap.set(edgeRes.edge, [x, y]);
					break;
				}
			}
		}

		// assemble closed rings by walking arcs via next pointers and grouping disconnected segments
		const visited = new Set<Edge>();
		const rings: Array<Array<[number, number]>> = [];
		for (const edgeRes of this.edges) {
			const startEdge = edgeRes.edge;
			
			if (visited.has(startEdge) || !intersectionMap.has(startEdge)) continue;
			
			const ring: Array<[number, number]> = [];
			let curr: Edge = startEdge;
			
			do {
				if (!intersectionMap.has(curr)) break;
				ring.push(intersectionMap.get(curr)!);
				visited.add(curr);
				curr = curr.next as Edge;
			} while (curr !== startEdge);
			
			if (ring.length) {
				const first = ring[0];
				const last = ring[ring.length - 1];
				if (first[0] !== last[0] || first[1] !== last[1]) {
					ring.push(first);
				}
				rings.push(ring);
			}
		}

		return { type: "MultiPolygon", coordinates: rings.map(r => [r]) };
	}
}