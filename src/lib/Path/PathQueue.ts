import PathQueueNode from "./PathQueueNode";

export default class PathQueue<T extends PathQueueNode<T>> {
	public size: number = 0;
	public first: PathQueueNode<T> = null;

	public addPush(node: PathQueueNode<T>, newNode: PathQueueNode<T>) {
		if (newNode.list !== null) {
			throw new Error("Node is already assigned to different list!");
		}

		if (node.next !== null && node.previous !== null) {
			throw new Error("Can't push new node. Node is inside a Queue. New node can by added only at the end of queue.");
		}

		newNode.list = this;
		this.size++;

		if (node.next === null) {
			newNode.previous = node;
			newNode.next = null;

			node.next = newNode;
		}
		else {
			newNode.previous = null;
			newNode.next = node;

			node.previous = newNode;
		}
	}

	public addFirst(node: T) {
		if (node.list !== null) {
			throw new Error("Node is already assigned to different list!");
		}

		if (this.first === null) {
			this.first = node;

			node.list = this;
			node.next = null;
			node.previous = null;

			this.size++;
		}
		else {
			throw new Error("First element already exists!");
		}
	}

	public pop(node: PathQueueNode<T>): PathQueueNode<T> {
		if (node.list !== this) {
			throw new Error("Node is not assigned to this list!");
		}

		if (this.size <= 0) {
			throw new Error("List is empty, can't remove!");
		}

		if (!node.isEnd) {
			throw new Error("Can pop only from end of queue!");
		}

		node.list = null;

		let previous: PathQueueNode<T> = null;

		if (this.size === 1) {
			this.first = null;
		}
		else {
			if (this.first === node) {
				if (node.next !== null) {
					this.first = node.next;
				}
				else if (node.previous !== null) {
					this.first = node.previous;
				}
				else {
					throw new Error("Ups ?");
				}
			}
			if (node.next !== null) {
				node.next.previous = null;
				previous = node.next;
			}
			else if (node.previous !== null) {
				node.previous.next = null;
				previous = node.previous;
			}
		}

		node.previous = null;
		node.next = null;

		this.size--;

		return previous;
	}

	public* iterate(): Generator<T> {
		let current: T = <T>(this.first !== null ? this.first.findEnd() : null);
		let i = 0;

		while (current !== null) {
			yield current;

			if (++i === this.size) {
				return;
			}

			current = <T>current.next;
		}
	}
}