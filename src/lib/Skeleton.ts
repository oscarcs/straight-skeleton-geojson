import {MultiLineString, MultiPolygon} from "geojson";
import {Vector2d} from "./Primitives/Vector2d";
import {EdgeResult} from "./EdgeResult";
import {Dictionary, List} from "./Utils";

export class Skeleton {
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
	toMultiLineString(): MultiLineString {
		const coordinates = this.edges.map(edgeRes =>
			edgeRes.polygon.map(point => [point.x, point.y])
		);
		return { type: "MultiLineString", coordinates };
	}

	/**
	 * Convert this skeleton to a MultiPolygon.
	 * @returns MultiPolygon
	 */
	toMultiPolygon(): MultiPolygon {
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
}