import Vector2d from "../Primitives/Vector2d";

export default abstract class SkeletonEvent {
	public v: Vector2d = null;
	public distance: number;

	public abstract get isObsolete(): boolean;

	protected constructor(point: Vector2d, distance: number) {
		this.v = point;
		this.distance = distance;
	}

	public toString(): string {
		return "IntersectEntry [V=" + this.v + ", Distance=" + this.distance + "]";
	}

	public getType(): string {
		return this.constructor.name;
	}
}