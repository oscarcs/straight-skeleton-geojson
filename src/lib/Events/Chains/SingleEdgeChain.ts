import IChain from "./IChain";
import Edge from "../../Circular/Edge";
import Vertex from "../../Circular/Vertex";
import ChainType from "./ChainType";

export default class SingleEdgeChain implements IChain {
	private readonly _nextVertex: Vertex;
	private readonly _oppositeEdge: Edge;
	private readonly _previousVertex: Vertex;

	constructor(oppositeEdge: Edge, nextVertex: Vertex) {
		this._oppositeEdge = oppositeEdge;
		this._nextVertex = nextVertex;
		this._previousVertex = nextVertex.previous as Vertex;
	}

	public get previousEdge(): Edge {
		return this._oppositeEdge;
	}

	public get nextEdge(): Edge {
		return this._oppositeEdge;
	}

	public get previousVertex(): Vertex {
		return this._previousVertex;
	}

	public get nextVertex(): Vertex {
		return this._nextVertex;
	}

	public get currentVertex(): Vertex {
		return null;
	}

	public get chainType(): ChainType {
		return ChainType.Split;
	}
}