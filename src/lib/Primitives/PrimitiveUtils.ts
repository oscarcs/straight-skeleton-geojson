import {Vector2d} from "./Vector2d";
import {LineParametric2d} from "./LineParametric2d";
import {List} from "../Utils";

class IntersectPoints {
	public readonly Intersect: Vector2d = null;
	public readonly IntersectEnd: Vector2d = null;

	constructor(intersect?: Vector2d, intersectEnd?: Vector2d) {
		if (!intersect) {
			intersect = Vector2d.Empty;
		}

		if (!intersectEnd) {
			intersectEnd = Vector2d.Empty;
		}

		this.Intersect = intersect;
		this.IntersectEnd = intersectEnd;
	}
}

export class PrimitiveUtils {
	public static fromTo(begin: Vector2d, end: Vector2d): Vector2d {
		return new Vector2d(end.x - begin.x, end.y - begin.y);
	}

	public static orthogonalLeft(v: Vector2d): Vector2d {
		return new Vector2d(-v.y, v.x);
	}

	public static orthogonalRight(v: Vector2d): Vector2d {
		return new Vector2d(v.y, -v.x);
	}

	public static orthogonalProjection(unitVector: Vector2d, vectorToProject: Vector2d): Vector2d {
		const n = new Vector2d(unitVector.x, unitVector.y).normalized();

		const px = vectorToProject.x;
		const py = vectorToProject.y;

		const ax = n.x;
		const ay = n.y;

		return new Vector2d(px * ax * ax + py * ax * ay, px * ax * ay + py * ay * ay);
	}

	public static bisectorNormalized(norm1: Vector2d, norm2: Vector2d): Vector2d {
		const e1v = PrimitiveUtils.orthogonalLeft(norm1);
		const e2v = PrimitiveUtils.orthogonalLeft(norm2);

		if (norm1.dot(norm2) > 0) {
			return e1v.add(e2v);
		}

		let ret = new Vector2d(norm1.x, norm1.y);
		ret.negate();
		ret = ret.add(norm2);

		if (e1v.dot(norm2) < 0) {
			ret.negate();
		}

		return ret;
	}

	private static readonly SMALL_NUM = 0.00000001;
	private static readonly EMPTY: IntersectPoints = new IntersectPoints();

	public static isPointOnRay(point: Vector2d, ray: LineParametric2d, epsilon: number): boolean {
		const rayDirection = new Vector2d(ray.U.x, ray.U.y).normalized();

		const pointVector = point.sub(ray.A);

		let dot = rayDirection.dot(pointVector);

		if (dot < epsilon) {
			return false;
		}

		const x = rayDirection.x;
		rayDirection.x = rayDirection.y;
		rayDirection.y = -x;

		dot = rayDirection.dot(pointVector);

		return -epsilon < dot && dot < epsilon;
	}

	public static intersectRays2D(r1: LineParametric2d, r2: LineParametric2d): IntersectPoints {
		const s1p0 = r1.A;
		const s1p1 = r1.A.add(r1.U);

		const s2p0 = r2.A;

		const u = r1.U;
		const v = r2.U;

		const w = s1p0.sub(s2p0);
		const d = PrimitiveUtils.perp(u, v);

		if (Math.abs(d) < PrimitiveUtils.SMALL_NUM) {
			if (PrimitiveUtils.perp(u, w) !== 0 || PrimitiveUtils.perp(v, w) !== 0) {
				return PrimitiveUtils.EMPTY;
			}

			const du = PrimitiveUtils.dot(u, u);
			const dv = PrimitiveUtils.dot(v, v);

			if (du === 0 && dv === 0) {
				if (s1p0.notEquals(s2p0)) {
					return PrimitiveUtils.EMPTY;
				}

				return new IntersectPoints(s1p0);
			}
			if (du === 0) {
				if (!PrimitiveUtils.inCollinearRay(s1p0, s2p0, v)) {
					return PrimitiveUtils.EMPTY;
				}

				return new IntersectPoints(s1p0);
			}
			if (dv === 0) {
				if (!PrimitiveUtils.inCollinearRay(s2p0, s1p0, u)) {
					return PrimitiveUtils.EMPTY;
				}

				return new IntersectPoints(s2p0);
			}

			let t0, t1;
			var w2 = s1p1.sub(s2p0);
			if (v.x !== 0) {
				t0 = w.x / v.x;
				t1 = w2.x / v.x;
			}
			else {
				t0 = w.y / v.y;
				t1 = w2.y / v.y;
			}
			
			if (t0 > t1) {
				const t = t0;
				t0 = t1;
				t1 = t;
			}
			
			if (t1 < 0) {
				return PrimitiveUtils.EMPTY;
			}

			t0 = t0 < 0 ? 0 : t0;

			if (t0 === t1) {
				let I0 = new Vector2d(v.x, v.y);
				I0 = I0.multiplyScalar(t0);
				I0 = I0.add(s2p0);

				return new IntersectPoints(I0);
			}

			let I_0 = new Vector2d(v.x, v.y);
			I_0 = I_0.multiplyScalar(t0);
			I_0 = I_0.add(s2p0);

			let I1 = new Vector2d(v.x, v.y);
			I1 = I1.multiplyScalar(t1);
			I1 = I1.add(s2p0);

			return new IntersectPoints(I_0, I1);
		}

		const sI = PrimitiveUtils.perp(v, w) / d;
		if (sI < 0 /* || sI > 1 */) {
			return PrimitiveUtils.EMPTY;
		}

		const tI = PrimitiveUtils.perp(u, w) / d;
		if (tI < 0 /* || tI > 1 */) {
			return PrimitiveUtils.EMPTY;
		}

		let IO = new Vector2d(u.x, u.y);
		IO = IO.multiplyScalar(sI);
		IO = IO.add(s1p0);

		return new IntersectPoints(IO);
	}

	private static inCollinearRay(p: Vector2d, rayStart: Vector2d, rayDirection: Vector2d): boolean {
		const collideVector = p.sub(rayStart);
		const dot = rayDirection.dot(collideVector);

		return !(dot < 0);
	}

	private static dot(u: Vector2d, v: Vector2d): number {
		return u.dot(v);
	}

	private static perp(u: Vector2d, v: Vector2d): number {
		return u.x * v.y - u.y * v.x;
	}

	public static isClockwisePolygon(polygon: List<Vector2d>): boolean {
		return PrimitiveUtils.area(polygon) < 0;
	}

	private static area(polygon: List<Vector2d>): number {
		const n = polygon.count;
		let A = 0;
		for (let p = n - 1, q = 0; q < n; p = q++) {
			A += polygon[p].x * polygon[q].y - polygon[q].x * polygon[p].y;
		}

		return A * 0.5;
	}

	public static makeCounterClockwise(polygon: List<Vector2d>): List<Vector2d> {
		if (PrimitiveUtils.isClockwisePolygon(polygon)) {
			polygon.reverse();
		}

		return polygon;
	}

	public static isPointInsidePolygon(point: Vector2d, points: List<Vector2d>): boolean {
		const numpoints = points.count;

		if (numpoints < 3) {
			return false;
		}

		let it = 0;
		const first = points[it];
		let oddNodes = false;

		for (let i = 0; i < numpoints; i++) {
			const node1 = points[it];
			it++;
			const node2 = i === numpoints - 1 ? first : points[it];

			const x = point.x;
			const y = point.y;

			if (node1.y < y && node2.y >= y || node2.y < y && node1.y >= y) {
				if (node1.x + (y - node1.y) / (node2.y - node1.y) * (node2.x - node1.x) < x) {
					oddNodes = !oddNodes;
				}
			}
		}

		return oddNodes;
	}
}