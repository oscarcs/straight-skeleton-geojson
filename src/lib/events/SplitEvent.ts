import {SkeletonEvent} from "./SkeletonEvent";
import {Edge} from "../circular/Edge";
import {Vertex} from "../circular/Vertex";
import {Vector2d} from "../primitives/Vector2d";

export class SplitEvent extends SkeletonEvent {
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