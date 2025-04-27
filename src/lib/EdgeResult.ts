import {Edge} from "./Circular/Edge";
import {Vector2d} from "./Primitives/Vector2d";
import {List} from "./Utils";

export class EdgeResult {
	public readonly edge: Edge;
	public readonly polygon: List<Vector2d>;

	constructor(edge: Edge, polygon: List<Vector2d>) {
		this.edge = edge;
		this.polygon = polygon;
	}
}