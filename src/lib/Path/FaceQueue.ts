import {PathQueue} from "./PathQueue";
import {FaceNode} from "./FaceNode";
import {PathQueueNode} from "./PathQueueNode";
import {Edge} from "../circular/Edge";

export class FaceQueue extends PathQueue<FaceNode> {
	public edge: Edge = null;
	public closed: boolean = false;

	public get isUnconnected(): boolean {
		return this.edge === null;
	}

	public override addPush(node: PathQueueNode<FaceNode>, newNode: PathQueueNode<FaceNode>) {
		if (this.closed) {
			throw new Error("Can't add node to closed FaceQueue");
		}

		super.addPush(node, newNode);
	}

	public close() {
		this.closed = true;
	}
}