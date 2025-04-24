import {ICircularList} from "./CircularList";

export default class CircularNode {
	public list: ICircularList = null;
	public next: CircularNode = null;
	public previous: CircularNode = null;

	public addNext(node: CircularNode) {
		this.list.addNext(this, node);
	}

	public addPrevious(node: CircularNode) {
		this.list.addPrevious(this, node);
	}

	public remove() {
		this.list.remove(this);
	}
}