import {IComparer, List} from "../Utils";

export default class PriorityQueue<T> {
	private readonly _comparer: IComparer<T> = null;
	private readonly _heap: List<T> = null;

	constructor(capacity: number, comparer: IComparer<T>) {
		this._heap = new List<T>(capacity);
		this._comparer = comparer;
	}

	public clear() {
		this._heap.clear();
	}

	public add(item: T) {
		let n = this._heap.count;
		this._heap.add(item);
		while (n !== 0) {
			const p = Math.floor(n / 2);
			if (this._comparer.compare(this._heap[n], (this._heap[p])) >= 0) break;
			const tmp: T = this._heap[n];
			this._heap[n] = this._heap[p];
			this._heap[p] = tmp;
			n = p;
		}
	}

	get count(): number {
		return this._heap.count;
	}

	get empty(): boolean {
		return this._heap.count === 0;
	}

	public peek(): T {
		return !this._heap.any() ? null : this._heap[0];
	}

	public next(): T {
		const val: T = this._heap[0];
		const nMax = this._heap.count - 1;
		this._heap[0] = this._heap[nMax];
		this._heap.removeAt(nMax);

		let p = 0;
		while (true) {
			let c = p * 2;
			if (c >= nMax) break;

			if (c + 1 < nMax && this._comparer.compare(this._heap[c + 1], this._heap[c]) < 0) c++;

			if (this._comparer.compare(this._heap[p], (this._heap[c])) <= 0) break;

			const tmp: T = this._heap[p];
			this._heap[p] = this._heap[c];
			this._heap[c] = tmp;
			p = c;
		}
		return val;
	}
}