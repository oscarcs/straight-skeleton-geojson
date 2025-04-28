import {SkeletonEvent} from "./SkeletonEvent";
import {Vector2d} from "../primitives/Vector2d";
import {EdgeChain} from "./chains/EdgeChain";

export class PickEvent extends SkeletonEvent {
	public readonly chain: EdgeChain;

	public override get isObsolete(): boolean {
		return false;
	}

	constructor(point: Vector2d, distance: number, chain: EdgeChain) {
		super(point, distance);

		this.chain = chain;
	}
}