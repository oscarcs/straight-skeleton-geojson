import {SkeletonEvent} from "./SkeletonEvent";
import {Vertex} from "../circular/Vertex";
import {Vector2d} from "../primitives/Vector2d";

export class EdgeEvent extends SkeletonEvent {
	public readonly nextVertex: Vertex;
	public readonly previousVertex: Vertex;

	public override get isObsolete(): boolean {
		return this.previousVertex.isProcessed || this.nextVertex.isProcessed;
	}

	constructor(point: Vector2d, distance: number, previousVertex: Vertex, nextVertex: Vertex) {
		super(point, distance);

		this.previousVertex = previousVertex;
		this.nextVertex = nextVertex;
	}

	public override toString(): string {
		return "EdgeEvent [V=" + this.v + ", PreviousVertex="
			+ (this.previousVertex !== null ? this.previousVertex.point.toString() : "null") +
			", NextVertex="
			+ (this.nextVertex !== null ? this.nextVertex.point.toString() : "null") + ", Distance=" +
			this.distance + "]";
	}
}