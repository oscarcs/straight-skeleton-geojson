import {MultiLineString, MultiPolygon} from "geojson";
import {Vector2d} from "./primitives/Vector2d";
import {EdgeResult} from "./EdgeResult";
import {Dictionary, List} from "./Utils";
import {FaceQueue} from "./path/FaceQueue";
import {FaceNode} from "./path/FaceNode";

export class StraightSkeleton {
	/**
	 * The edges of the straight skeleton
	 */ 
	public readonly edges: List<EdgeResult> = null;

	/**
	 * The distances from the original polygon to each point in the skeleton
	 */
	public readonly distances: Dictionary<Vector2d, number> = null;

	/**
	 * The faces of the straight skeleton (boundary lists for each cell)
	 */
	public readonly faces: FaceQueue[];

	constructor(edges: List<EdgeResult>, distances: Dictionary<Vector2d, number>, faces: FaceQueue[]) {
		this.edges = edges;
		this.distances = distances;
		this.faces = faces;
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
		const rings: Array<Array<[number, number]>> = [];
		for (const face of this.faces) {
			const nodes: FaceNode[] = Array.from<FaceNode>(face.iterate());
			const pts: Array<[number, number]> = [];
			for (let i = 0; i < nodes.length; i++) {
				const curr = nodes[i];
				const next = nodes[(i + 1) % nodes.length];
				const p1 = curr.vertex.point;
				const p2 = next.vertex.point;
				const d1 = this.distances.get(p1);
				const d2 = this.distances.get(p2);
				if (d1 === undefined || d2 === undefined) continue;
				if ((d1 - d) * (d2 - d) <= 0 && d1 !== d2) {
					const t = (d - d1) / (d2 - d1);
					const x = p1.x + (p2.x - p1.x) * t;
					const y = p1.y + (p2.y - p1.y) * t;
					pts.push([x, y]);
				}
			}
			
			if (pts.length > 0) {
				const [x0, y0] = pts[0];
				const [xN, yN] = pts[pts.length - 1];
				if (x0 !== xN || y0 !== yN) pts.push([x0, y0]);
				rings.push(pts);
			}
		}
		return { type: "MultiPolygon", coordinates: rings.map(r => [r]) };
	}
}