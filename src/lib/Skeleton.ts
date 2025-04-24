import {MultiLineString} from "geojson";
import Vector2d from "./Primitives/Vector2d";
import EdgeResult from "./EdgeResult";
import {Dictionary, List} from "./Utils";

export class Skeleton {
	public readonly edges: List<EdgeResult> = null;
	public readonly distances: Dictionary<Vector2d, number> = null;

	constructor(edges: List<EdgeResult>, distances: Dictionary<Vector2d, number>) {
		this.edges = edges;
		this.distances = distances;
	}

	toMultiLineString(): MultiLineString {
		const coordinates = this.edges.map(edgeRes =>
			edgeRes.polygon.map(point => [point.x, point.y])
		);
		return { type: "MultiLineString", coordinates };
	}
}