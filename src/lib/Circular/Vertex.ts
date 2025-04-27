import {CircularNode} from "./CircularNode";
import {Vector2d} from "../Primitives/Vector2d";
import {LineParametric2d} from "../Primitives/LineParametric2d";
import {Edge} from "./Edge";
import {FaceNode} from "../Path/FaceNode";

export class Vertex extends CircularNode {
	readonly roundDigitCount = 5;

	public point: Vector2d = null;
	public readonly distance: number;
	public readonly bisector: LineParametric2d = null;

	public readonly nextEdge: Edge = null;
	public readonly previousEdge: Edge = null;

	public leftFace: FaceNode = null;
	public rightFace: FaceNode = null;

	public isProcessed: boolean;

	constructor(point: Vector2d, distance: number, bisector: LineParametric2d, previousEdge: Edge, nextEdge: Edge) {
		super();

		this.point = point;
		this.distance = +distance.toFixed(this.roundDigitCount);
		this.bisector = bisector;
		this.previousEdge = previousEdge;
		this.nextEdge = nextEdge;

		this.isProcessed = false;
	}

	public override toString(): string {
		return "Vertex [v=" + this.point + ", IsProcessed=" + this.isProcessed +
			", Bisector=" + this.bisector + ", PreviousEdge=" + this.previousEdge +
			", NextEdge=" + this.nextEdge;
	}
}