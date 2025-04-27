import {Edge} from "../../circular/Edge";
import {Vertex} from "../../circular/Vertex";
import {ChainType} from "./ChainType";

export interface IChain {
	get previousEdge(): Edge;

	get nextEdge(): Edge;

	get previousVertex(): Vertex;

	get nextVertex(): Vertex;

	get currentVertex(): Vertex;

	get chainType(): ChainType;
}