function insertInArray<T>(array: Array<T>, index: number, item: T): Array<T> {
	const items = Array.prototype.slice.call(arguments, 2);

	return [].concat(array.slice(0, index), items, array.slice(index));
}

export interface IComparable<T> {
	CompareTo(other: T): number;
}

export interface IComparer<T> {
	compare(a: T, b: T): number;
}

export class List<T> extends Array<T> {
	constructor(capacity = 0) {
		super();
	}

	public add(item: T) {
		this.push(item);
	}

	public insert(index: number, item: T) {
		const newArr = insertInArray(this, index, item);

		this.length = newArr.length;

		for (let i = 0; i < newArr.length; i++) {
			this[i] = newArr[i];
		}
	}

	public clear() {
		this.length = 0;
	}

	get count(): number {
		return this.length;
	}

	public any(filter?: (item: T) => boolean): boolean {
		if (!filter) {
			filter = T => true;
		}

		for (const item of this) {
			if (filter(item)) {
				return true;
			}
		}

		return false;
	}

	public removeAt(index: number) {
		this.splice(index, 1);
	}

	public remove(itemToRemove: T) {
		const newArr = this.filter(item => item !== itemToRemove);

		this.length = newArr.length;

		for(let i = 0; i < newArr.length; i++) {
			this[i] = newArr[i];
		}
	}

	public addRange(list: List<T>) {
		for (const item of list) {
			this.add(item);
		}
	}

	public override sort(comparer: IComparer<T> | ((a: T, b: T) => number)): this {
		if (typeof comparer !== 'function' && 'compare' in comparer) {
			return super.sort(comparer.compare.bind(comparer));
		}
		else {
			return super.sort(comparer as (a: T, b: T) => number);
		}
	}
}

export class HashSet<T> implements Iterable<T> {
	private set: Set<T>;

	constructor() {
		this.set = new Set();
	}

	public add(item: T) {
		this.set.add(item);
	}

	public remove(item: T) {
		this.set.delete(item);
	}

	public removeWhere(filter: (item: T) => boolean) {
		for (const item of this.set.values()) {
			if (filter(item)) {
				this.set.delete(item);
			}
		}
	}

	public contains(item: T): boolean {
		return this.set.has(item);
	}

	public clear() {
		this.set.clear();
	}

	public* [Symbol.iterator](): Generator<T> {
		for (const item of this.set.values()) {
			yield item;
		}
	}
}

export class Dictionary<T1, T2> extends Map<T1, T2> {
	public containsKey(key: T1): boolean {
		return this.has(key);
	}

	public add(key: T1, value: T2) {
		return this.set(key, value);
	}
}