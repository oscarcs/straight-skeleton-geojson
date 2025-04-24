import SkeletonEvent from "./SkeletonEvent";
import Edge from "../Circular/Edge";
import Vertex from "../Circular/Vertex";
import Vector2d from "../Primitives/Vector2d";

export default class SplitEvent extends SkeletonEvent {
	public readonly oppositeEdge: Edge = null;
	public readonly parent: Vertex = null;

	constructor(point: Vector2d, distance: number, parent: Vertex, oppositeEdge: Edge) {
		super(point, distance);

		this.parent = parent;
		this.oppositeEdge = oppositeEdge;
	}

	public override get isObsolete(): boolean {
		return this.parent.isProcessed;
	}


	public override toString(): string {
		return "SplitEvent [V=" + this.v + ", Parent=" + (this.parent !== null ? this.parent.point.toString() : "null") +
			", Distance=" + this.distance + "]";
	}
}