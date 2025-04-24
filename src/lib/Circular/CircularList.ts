import CircularNode from "./CircularNode";

export interface ICircularList {
	readonly Size: number;

	addNext(node: CircularNode, newNode: CircularNode): void;

	addPrevious(node: CircularNode, newNode: CircularNode): void;

	addLast(node: CircularNode): void;

	remove(node: CircularNode): void;
}

export default class CircularList<T extends CircularNode> implements ICircularList {
	private _first: T = null;
	private _size: number = 0;

	public addNext(node: CircularNode, newNode: CircularNode) {
		if (newNode.list !== null) {
			throw new Error("Node is already assigned to different list!");
		}

		newNode.list = this;

		newNode.previous = node;
		newNode.next = node.next;

		node.next.previous = newNode;
		node.next = newNode;

		this._size++;
	}

	addPrevious(node: CircularNode, newNode: CircularNode) {
		if (newNode.list !== null) {
			throw new Error("Node is already assigned to different list!");
		}

		newNode.list = this;

		newNode.previous = node.previous;
		newNode.next = node;

		node.previous.next = newNode;
		node.previous = newNode;

		this._size++;
	}

	addLast(node: CircularNode) {
		if (node.list !== null) {
			throw new Error("Node is already assigned to different list!");
		}

		if (this._first === null) {
			this._first = node as T;

			node.list = this;
			node.next = node;
			node.previous = node;

			this._size++;
		}
		else {
			this.addPrevious(this._first, node);
		}
	}

	remove(node: CircularNode) {
		if (node.list !== this) {
			throw new Error("Node is not assigned to this list!");
		}

		if (this._size <= 0) {
			throw new Error("List is empty can't remove!");
		}

		node.list = null;

		if (this._size === 1) {
			this._first = null;
		}

		else {
			if (this._first === node) {
				this._first = <T>this._first.next;
			}

			node.previous.next = node.next;
			node.next.previous = node.previous;
		}

		node.previous = null;
		node.next = null;

		this._size--;
	}

	public get Size(): number {
		return this._size;
	}

	public First(): T {
		return this._first;
	}

	public* Iterate(): Generator<T> {
		let current = this._first;
		let i = 0;

		while (current !== null) {
			yield current;

			if (++i === this.Size) {
				return;
			}

			current = <T>current.next;
		}
	}
}