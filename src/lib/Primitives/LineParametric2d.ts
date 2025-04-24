import Vector2d from "./Vector2d";
import LineLinear2d from "./LineLinear2d";
import PrimitiveUtils from "./PrimitiveUtils";

export default class LineParametric2d {
	public static readonly Empty: LineParametric2d = new LineParametric2d(Vector2d.Empty, Vector2d.Empty);

	public A: Vector2d = null;
	public U: Vector2d = null;

	constructor(pA: Vector2d, pU: Vector2d) {
		this.A = pA;
		this.U = pU;
	}

	public createLinearForm(): LineLinear2d {
		const x = this.A.x;
		const y = this.A.y;

		const B = -this.U.x;
		const A = this.U.y;

		const C = -(A * x + B * y);

		return new LineLinear2d().setFromCoefficients(A, B, C);
	}

	public static collide(ray: LineParametric2d, line: LineLinear2d, epsilon: number): Vector2d {
		const collide = LineLinear2d.collide(ray.createLinearForm(), line);
		if (collide.equals(Vector2d.Empty)) {
			return Vector2d.Empty;
		}

		const collideVector = collide.sub(ray.A);
		return ray.U.dot(collideVector) < epsilon ? Vector2d.Empty : collide;
	}

	public isOnLeftSite(point: Vector2d, epsilon: number): boolean {
		const direction = point.sub(this.A);
		return PrimitiveUtils.orthogonalRight(this.U).dot(direction) < epsilon;
	}

	public isOnRightSite(point: Vector2d, epsilon: number): boolean {
		const direction = point.sub(this.A);
		return PrimitiveUtils.orthogonalRight(this.U).dot(direction) > -epsilon;
	}
}