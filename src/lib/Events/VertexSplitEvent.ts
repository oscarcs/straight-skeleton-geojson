import SplitEvent from "./SplitEvent";
import Vector2d from "../Primitives/Vector2d";
import Vertex from "../Circular/Vertex";

export default class VertexSplitEvent extends SplitEvent {
	constructor(point: Vector2d, distance: number, parent: Vertex) {
		super(point, distance, parent, null);
	}

	public override toString(): string {
		return "VertexSplitEvent [V=" + this.v + ", Parent=" +
			(this.parent !== null ? this.parent.point.toString() : "null")
			+ ", Distance=" + this.distance + "]";
	}
}