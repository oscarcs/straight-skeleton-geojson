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
	 * Compute the offset at distance d using the straight skeleton.
	 * @param d offset distance
	 * @returns MultiPolygon of offset shape(s)
	 */
	public offset(d: number): MultiPolygon {
		// Helper to create a sorted key for an undirected skeleton segment
		const makeKey = (a: Vector2d, b: Vector2d): string => {
			const k1 = `${a.x},${a.y}|${b.x},${b.y}`;
			const k2 = `${b.x},${b.y}|${a.x},${a.y}`;
			return k1 < k2 ? k1 : k2;
		};

		const loops: Array<Array<[number, number]>> = [];
		const visited = new Set<string>();
		const adjacency = new Map<string, Array<{faceIndex: number, index: number, u: Vector2d, v: Vector2d}>>();

		// build adjacency map for each skeleton segment across faces
		for (let fi = 0; fi < this.edges.length; fi++) {
			const poly = this.edges[fi].polygon;
			for (let j = 0; j < poly.count - 1; j++) {
				const u = poly[j], v = poly[j + 1];
				const key = makeKey(u, v);
				if (!adjacency.has(key)) {
					adjacency.set(key, []);
				}
				adjacency.get(key).push({ faceIndex: fi, index: j, u, v });
			}
		}

		// scan all segments, trace new loops when d is in interval and not yet visited
		for (let fi = 0; fi < this.edges.length; fi++) {
			const poly = this.edges[fi].polygon;
			for (let j = 0; j < poly.count - 1; j++) {
				const p0 = poly[j], p1 = poly[j + 1];
				const tag = `${fi}:${j}`;
				if (visited.has(tag)) {
					continue;
				} 
				const d0 = this.distances.get(p0)!;
				const d1 = this.distances.get(p1)!;
				if (d < Math.min(d0, d1) || d > Math.max(d0, d1)) {
					continue;
				}

				const loop: Array<[number, number]> = [];
				let curFace = fi, curIdx = j, curU = p0, curV = p1;
				let startTag = `${fi}:${j}`;
				let key = makeKey(curU, curV);

				do {
					// interpolate intersection point
					const du = this.distances.get(curU)!;
					const dv = this.distances.get(curV)!;
					const t = (d - du) / (dv - du);
					const x = curU.x + (curV.x - curU.x) * t;
					const y = curU.y + (curV.y - curU.y) * t;
					loop.push([x, y]);

					visited.add(`${curFace}:${curIdx}`);

					// find the opposite face sharing this segment
					const entries = adjacency.get(key) || [];
					let neighbor: {faceIndex: number, index: number, u: Vector2d, v: Vector2d} | undefined;
					for (const e of entries) {
						if (e.faceIndex !== curFace) { neighbor = e; break; }
					}
					if (!neighbor) {
						break;
					}

					// enter neighbor face and look for next segment
					const nf = neighbor.faceIndex;
					const startIdx = neighbor.index;
					const poly2 = this.edges[nf].polygon;
					let found = false;
					for (let k = 1; k < poly2.count; k++) {
						const idx = (startIdx + k) % (poly2.count - 1);
						const a = poly2[idx], b = poly2[idx + 1];
						const da = this.distances.get(a)!, db = this.distances.get(b)!;
						if (d >= Math.min(da, db) && d <= Math.max(da, db)) {
							curFace = nf;
							curIdx = idx;
							curU = a;
							curV = b;
							key = makeKey(curU, curV);
							found = true;
							break;
						}
					}
					if (!found) {
						break;
					}

				}
				while (`${curFace}:${curIdx}` !== startTag);

				if (loop.length > 0) {
					loops.push(loop);
				}
			}
		}

		// wrap each loop as a single-ring polygon in a MultiPolygon
		return { type: "MultiPolygon", coordinates: loops.map(r => [r]) };
	}
}