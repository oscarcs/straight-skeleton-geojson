import IChain from "./IChain";
import Edge from "../../Circular/Edge";
import Vertex from "../../Circular/Vertex";
import ChainType from "./ChainType";
import VertexSplitEvent from "../VertexSplitEvent";
import SplitEvent from "../SplitEvent";

export default class SplitChain implements IChain {
	private readonly _splitEvent: SplitEvent;

	constructor(event: SplitEvent) {
		this._splitEvent = event;
	}

	public get OppositeEdge(): Edge {
		if (!(this._splitEvent instanceof VertexSplitEvent))
			return this._splitEvent.oppositeEdge;

		return null;
	}

	public get previousEdge(): Edge {
		return this._splitEvent.parent.previousEdge;
	}

	public get nextEdge(): Edge {
		return this._splitEvent.parent.nextEdge;
	}

	public get previousVertex(): Vertex {
		return this._splitEvent.parent.previous as Vertex;
	}

	public get nextVertex(): Vertex {
		return this._splitEvent.parent.next as Vertex;
	}

	public get currentVertex(): Vertex {
		return this._splitEvent.parent;
	}

	public get chainType(): ChainType {
		return ChainType.Split;
	}
}