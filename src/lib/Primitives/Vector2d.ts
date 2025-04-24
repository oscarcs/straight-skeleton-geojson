export default class Vector2d {
	public static Empty: Vector2d = new Vector2d(Number.MIN_VALUE, Number.MIN_VALUE);

	public x: number = 0;
	public y: number = 0;

	constructor(x: number, y: number) {
		this.x = x;
		this.y = y;
	}

	public negate() {
		this.x = -this.x;
		this.y = -this.y;
	}

	public distanceTo(var1: Vector2d): number {
		const var2 = this.x - var1.x;
		const var4 = this.y - var1.y;
		return Math.sqrt(var2 * var2 + var4 * var4);
	}

	public normalized(): Vector2d {
		const var1 = 1 / Math.sqrt(this.x * this.x + this.y * this.y);
		return new Vector2d(this.x * var1, this.y * var1);
	}

	public dot(var1: Vector2d): number {
		return this.x * var1.x + this.y * var1.y;
	}

	public distanceSquared(var1: Vector2d): number {
		const var2 = this.x - var1.x;
		const var4 = this.y - var1.y;
		return var2 * var2 + var4 * var4;
	}

	public add(v: Vector2d): Vector2d {
		return new Vector2d(this.x + v.x, this.y + v.y);
	}

	public sub(v: Vector2d): Vector2d {
		return new Vector2d(this.x - v.x, this.y - v.y);
	}

	public multiplyScalar(scale: number): Vector2d {
		return new Vector2d(this.x * scale, this.y * scale);
	}

	public equals(v: Vector2d): boolean {
		return this.x === v.x && this.y === v.y;
	}

	public notEquals(v: Vector2d): boolean {
		return !this.equals(v);
	}

	public toString(): string {
		return `${this.x}, ${this.y}`;
	}
}