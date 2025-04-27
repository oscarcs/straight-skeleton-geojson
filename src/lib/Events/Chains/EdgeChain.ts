import {IChain} from "./IChain";
import {EdgeEvent} from "../EdgeEvent";
import {List} from "../../Utils";
import {Edge} from "../../Circular/Edge";
import {Vertex} from "../../Circular/Vertex";
import {ChainType} from "./ChainType";

export class EdgeChain implements IChain {
	private readonly _closed: boolean;
	public edgeList: List<EdgeEvent>;

	constructor(edgeList: List<EdgeEvent>) {
		this.edgeList = edgeList;
		this._closed = this.previousVertex === this.nextVertex;
	}

	public get previousEdge(): Edge {
		return this.edgeList[0].previousVertex.previousEdge;
	}

	public get nextEdge(): Edge {
		return this.edgeList[this.edgeList.count - 1].nextVertex.nextEdge;
	}

	public get previousVertex(): Vertex {
		return this.edgeList[0].previousVertex;
	}

	public get nextVertex(): Vertex {
		return this.edgeList[this.edgeList.count - 1].nextVertex;
	}

	public get currentVertex(): Vertex {
		return null;
	}

	public get chainType(): ChainType {
		return this._closed ? ChainType.ClosedEdge : ChainType.Edge;
	}
}