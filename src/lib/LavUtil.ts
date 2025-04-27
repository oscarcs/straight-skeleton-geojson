import {Vertex} from "./circular/Vertex";
import {List} from "./Utils";
import {CircularList} from "./circular/CircularList";

/**
 * The algorithm computes and simulates the events by maintaining a set of circular Lists of Active Vertices (LAVs).
 */
export class LavUtil {
	public static isSameLav(v1: Vertex, v2: Vertex): boolean {
		if (v1.list === null || v2.list === null) {
			return false;
		}
		return v1.list === v2.list;
	}

	public static removeFromLav(vertex: Vertex) {
		if (vertex === null || vertex.list === null) {
			return;
		}
		vertex.remove();
	}

	public static cutLavPart(startVertex: Vertex, endVertex: Vertex): List<Vertex> {
		const ret = new List<Vertex>();
		const size = startVertex.list.Size;
		let next = startVertex;

		for (let i = 0; i < size; i++) {
			const current = next;
			next = current.next as Vertex;
			current.remove();
			ret.add(current);

			if (current === endVertex) {
				return ret;
			}
		}

		throw new Error("End vertex can't be found in start vertex lav");
	}

	public static mergeBeforeBaseVertex(base: Vertex, merged: Vertex) {
		const size = merged.list.Size;

		for (let i = 0; i < size; i++) {
			const nextMerged = merged.next as Vertex;
			nextMerged.remove();

			base.addPrevious(nextMerged);
		}
	}

	public static moveAllVertexToLavEnd(vertex: Vertex, newLaw: CircularList<Vertex>) {
		const size = vertex.list.Size;
		for (let i = 0; i < size; i++) {
			const ver = vertex;
			vertex = vertex.next as Vertex;
			ver.remove();
			newLaw.addLast(ver);
		}
	}
}