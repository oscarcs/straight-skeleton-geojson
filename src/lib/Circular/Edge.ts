import CircularNode from "./CircularNode";
import Vector2d from "../Primitives/Vector2d";
import LineLinear2d from "../Primitives/LineLinear2d";
import LineParametric2d from "../Primitives/LineParametric2d";

export default class Edge extends CircularNode {
	public readonly begin: Vector2d;
	public readonly end: Vector2d;
	public readonly norm: Vector2d;

	public readonly lineLinear2d: LineLinear2d;
	public bisectorNext: LineParametric2d = null;
	public bisectorPrevious: LineParametric2d = null;

	constructor(begin: Vector2d, end: Vector2d) {
		super();

		this.begin = begin;
		this.end = end;

		this.lineLinear2d = new LineLinear2d(begin, end);
		this.norm = end.sub(begin).normalized();
	}

	public override toString(): string {
		return `Edge [p1=${this.begin}, p2=${this.end}]`;
	}
}