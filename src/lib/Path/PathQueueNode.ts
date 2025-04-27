import {PathQueue} from "./PathQueue";

export class PathQueueNode<T extends PathQueueNode<T>> {
	public list: PathQueue<T> = null;
	public next: PathQueueNode<T> = null;
	public previous: PathQueueNode<T> = null;

	public get isEnd(): boolean {
		return this.next === null || this.previous === null;
	}

	public addPush(node: PathQueueNode<T>) {
		this.list.addPush(this, node);
	}

	public addQueue(queue: PathQueueNode<T>): PathQueueNode<T> {
		if (this.list === queue.list)
			return null;

		let currentQueue: PathQueueNode<T> = this;

		let current = queue;

		while (current !== null) {
			const next = current.pop();

			currentQueue.addPush(current);
			currentQueue = current;

			current = next;
		}

		return currentQueue;
	}

	public findEnd(): PathQueueNode<T> {
		if (this.isEnd) {
			return this;
		}

		let current: PathQueueNode<T> = this;

		while (current.previous !== null) {
			current = current.previous;
		}

		return current;
	}

	public pop(): PathQueueNode<T> {
		return this.list.pop(this);
	}
}