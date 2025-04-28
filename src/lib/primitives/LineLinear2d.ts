import {Vector2d} from "./Vector2d";

export class LineLinear2d {
	public A: number;
	public B: number;
	public C: number;

	constructor(pP1: Vector2d = Vector2d.Empty, pP2: Vector2d = Vector2d.Empty) {
		this.A = pP1.y - pP2.y;
		this.B = pP2.x - pP1.x;
		this.C = pP1.x * pP2.y - pP2.x * pP1.y;
	}

	public setFromCoefficients(a: number, b: number, c: number): LineLinear2d {
		this.A = a;
		this.B = b;
		this.C = c;

		return this;
	}

	public collide(pLine: LineLinear2d): Vector2d {
		return LineLinear2d.collide(this, pLine);
	}

	public static collide(pLine1: LineLinear2d, pLine2: LineLinear2d): Vector2d {
		return LineLinear2d.collideCoeff(pLine1.A, pLine1.B, pLine1.C, pLine2.A, pLine2.B, pLine2.C);
	}

	public static collideCoeff(A1: number, B1: number, C1: number, A2: number, B2: number, C2: number): Vector2d {
		const WAB = A1 * B2 - A2 * B1;
		const WBC = B1 * C2 - B2 * C1;
		const WCA = C1 * A2 - C2 * A1;

		return WAB === 0 ? Vector2d.Empty : new Vector2d(WBC / WAB, WCA / WAB);
	}

	public contains(point: Vector2d): boolean {
		return Math.abs((point.x * this.A + point.y * this.B + this.C)) < Number.EPSILON;
	}
}