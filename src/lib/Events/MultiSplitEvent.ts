import {SkeletonEvent} from "./SkeletonEvent";
import {List} from "../Utils";
import {IChain} from "./Chains/IChain";
import {Vector2d} from "../Primitives/Vector2d";

export class MultiSplitEvent extends SkeletonEvent {
	public readonly chains: List<IChain>;

	public override get isObsolete(): boolean {
		return false;
	}

	constructor(point: Vector2d, distance: number, chains: List<IChain>) {
		super(point, distance);

		this.chains = chains;
	}
}