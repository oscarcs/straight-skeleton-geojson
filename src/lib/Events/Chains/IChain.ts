import Edge from "../../Circular/Edge";
import Vertex from "../../Circular/Vertex";
import ChainType from "./ChainType";

export default interface IChain {
	get previousEdge(): Edge;

	get nextEdge(): Edge;

	get previousVertex(): Vertex;

	get nextVertex(): Vertex;

	get currentVertex(): Vertex;

	get chainType(): ChainType;
}