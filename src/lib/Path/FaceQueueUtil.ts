import {FaceNode} from "./FaceNode";

export class FaceQueueUtil {
	public static connectQueues(firstFace: FaceNode, secondFace: FaceNode) {
		if (firstFace.list === null) {
			throw new Error("firstFace.list cannot be null.");
		}
		if (secondFace.list === null) {
			throw new Error("secondFace.list cannot be null.");
		}

		if (firstFace.list === secondFace.list) {
			if (!firstFace.isEnd || !secondFace.isEnd) {
				throw new Error("Try to connect the same list not on end nodes");
			}

			if (firstFace.isQueueUnconnected || secondFace.isQueueUnconnected) {
				throw new Error("Can't close node queue not conected with edges");
			}

			firstFace.queueClose();
			return;
		}

		if (!firstFace.isQueueUnconnected && !secondFace.isQueueUnconnected) {
			throw new Error("Can't connect two diffrent queues if each of them is connected to edge");
		}

		if (!firstFace.isQueueUnconnected) {
			const qLeft = secondFace.faceQueue;
			this.moveNodes(firstFace, secondFace);
			qLeft.close();
		}
		else {
			const qRight = firstFace.faceQueue;
			this.moveNodes(secondFace, firstFace);
			qRight.close();
		}
	}

	private static moveNodes(firstFace: FaceNode, secondFace: FaceNode) {
		firstFace.addQueue(secondFace);
	}
}