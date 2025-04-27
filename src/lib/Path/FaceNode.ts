import {PathQueueNode} from "./PathQueueNode";
import {Vertex} from "../Circular/Vertex";
import {FaceQueue} from "./FaceQueue";

export class FaceNode extends PathQueueNode<FaceNode> {
	public readonly vertex: Vertex = null;

	constructor(vertex: Vertex) {
		super();
		this.vertex = vertex;
	}

	public get faceQueue(): FaceQueue {
		return <FaceQueue>this.list;
	}

	public get isQueueUnconnected(): boolean {
		return this.faceQueue.isUnconnected;
	}

	public queueClose() {
		this.faceQueue.close();
	}
}