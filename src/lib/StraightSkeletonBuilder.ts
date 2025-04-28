import {MultiPolygon, Position} from "geojson";
import {StraightSkeleton} from "./StraightSkeleton";
import {HashSet, List, IComparer, Dictionary} from "./Utils";
import {Vector2d} from "./primitives/Vector2d";
import {PriorityQueue} from "./primitives/PriorityQueue";
import {Edge} from "./circular/Edge";
import {Vertex} from "./circular/Vertex";
import {CircularList} from "./circular/CircularList";
import {FaceQueue} from "./path/FaceQueue";
import {SkeletonEvent} from "./events/SkeletonEvent";
import {FaceQueueUtil} from "./path/FaceQueueUtil";
import {LavUtil} from "./LavUtil";
import {IChain} from "./events/chains/IChain";
import {PrimitiveUtils} from "./primitives/PrimitiveUtils";
import {LineParametric2d} from "./primitives/LineParametric2d";
import {FaceNode} from "./path/FaceNode";
import {MultiEdgeEvent} from "./events/MultiEdgeEvent";
import {EdgeEvent} from "./events/EdgeEvent";
import {PickEvent} from "./events/PickEvent";
import {MultiSplitEvent} from "./events/MultiSplitEvent";
import {SingleEdgeChain} from "./events/chains/SingleEdgeChain";
import {SplitChain} from "./events/chains/SplitChain";
import {SplitEvent} from "./events/SplitEvent";
import {VertexSplitEvent} from "./events/VertexSplitEvent";
import {EdgeChain} from "./events/chains/EdgeChain";
import {LineLinear2d} from "./primitives/LineLinear2d";
import {EdgeResult} from "./EdgeResult";
import {ChainType} from "./events/chains/ChainType";

export class StraightSkeletonBuilder {
	private static readonly RELATIVE_EPSILON = 1e-11;
	private static splitEpsilon = StraightSkeletonBuilder.RELATIVE_EPSILON;

	/**
	 * Builds a straight skeleton from a GeoJSON MultiPolygon.
	 * @param multipolygon 
	 * @returns Skeleton
	 */
	public static buildFromGeoJSON(multipolygon: MultiPolygon): StraightSkeleton {
		const allEdges: List<EdgeResult> = new List();
		const allDistances: Dictionary<Vector2d, number> = new Dictionary();

		for (const polygon of multipolygon.coordinates) {
			if (polygon.length > 0) {
				const outer = this.listFromPolygon(polygon[0]);
				const holes: List<List<Vector2d>> = new List();

				for (let i = 1; i < polygon.length; i++) {
					holes.add(this.listFromPolygon(polygon[i]));
				}

				const skeleton = this.build(outer, holes);

				for (const edge of skeleton.edges) {
					allEdges.add(edge);
				}

				for (const [key, distance] of skeleton.distances.entries()) {
					allDistances.add(key, distance);
				}
			}
		}

		return new StraightSkeleton(allEdges, allDistances);
	}

	private static listFromPolygon(positions: Position[]): List<Vector2d> {
		const list: List<Vector2d> = new List();

		// Exclude the last position because it is the same as the first one, per the specification
		for (const [x, y] of positions.slice(0, -1)) {
			list.add(new Vector2d(x, y));
		}

		return list;
	}

	// compute dynamic epsilon based on input geometry scale
	private static computeDynamicEpsilon(polygon: List<Vector2d>, holes: List<List<Vector2d>>) {
		let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
		for (const pt of polygon) {
			minX = Math.min(minX, pt.x);
			maxX = Math.max(maxX, pt.x);
			minY = Math.min(minY, pt.y);
			maxY = Math.max(maxY, pt.y);
		}
		if (holes !== null) {
			for (const hole of holes) {
				for (const pt of hole) {
					minX = Math.min(minX, pt.x);
					maxX = Math.max(maxX, pt.x);
					minY = Math.min(minY, pt.y);
					maxY = Math.max(maxY, pt.y);
				}
			}
		}
		const span = Math.max(maxX - minX, maxY - minY);
		const base = span > 0 ? span : 1;
		this.splitEpsilon = base * this.RELATIVE_EPSILON;
	}

	/**
	 * Build a straight skeleton from a polygon and an optional list of holes.
	 * @param polygon 
	 * @param holes 
	 * @returns Skeleton
	 */
	public static build(polygon: List<Vector2d>, holes: List<List<Vector2d>> = null): StraightSkeleton {
		this.computeDynamicEpsilon(polygon, holes);

		polygon = this.initPolygon(polygon);
		holes = this.makeClockwise(holes);

		const queue = new PriorityQueue<SkeletonEvent>(3, new SkeletonEventDistanseComparer());
		const sLav = new HashSet<CircularList<Vertex>>();
		const faces = new List<FaceQueue>();
		const edges = new List<Edge>();

		this.initSlav(polygon, sLav, edges, faces);

		if (holes !== null) {
			for (const inner of holes) {
				this.initSlav(inner, sLav, edges, faces);
			}
		}

		this.initEvents(sLav, queue, edges);

		let count = 0;
		while (!queue.empty) {
			count = this.assertMaxNumberOfInteraction(count);
			const levelHeight = queue.peek().distance;

			for (const event of this.loadAndGroupLevelEvents(queue)) {
				if (event.isObsolete) {
					continue;
				}

				if (event instanceof EdgeEvent) {
					throw new Error("All edge@events should be converted to MultiEdgeEvents for given level");
				}
				if (event instanceof SplitEvent) {
					throw new Error("All split events should be converted to MultiSplitEvents for given level");
				}
				if (event instanceof MultiSplitEvent) {
					this.multiSplitEvent(<MultiSplitEvent>event, sLav, queue, edges);
				}
				else if (event instanceof PickEvent) {
					this.pickEvent(<PickEvent>event);
				}
				else if (event instanceof MultiEdgeEvent) {
					this.multiEdgeEvent(<MultiEdgeEvent>event, queue, edges);
				}
				else {
					throw new Error("Unknown event type: " + event.getType());
				}
			}

			this.processTwoNodeLavs(sLav);
			this.removeEventsUnderHeight(queue, levelHeight);
			this.removeEmptyLav(sLav);
		}

		return this.addFacesToOutput(faces);
	}

	private static initPolygon(polygon: List<Vector2d>): List<Vector2d> {
		if (polygon === null) {
			throw new Error("polygon can't be null");
		}

		if (polygon[0].equals(polygon[polygon.count - 1])) {
			throw new Error("polygon can't start and end with the same point");
		}

		return this.makeCounterClockwise(polygon);
	}

	private static processTwoNodeLavs(sLav: HashSet<CircularList<Vertex>>) {
		for (const lav of sLav) {
			if (lav.Size === 2) {
				const first = lav.First();
				const last = first.next as Vertex;

				FaceQueueUtil.connectQueues(first.leftFace, last.rightFace);
				FaceQueueUtil.connectQueues(first.rightFace, last.leftFace);

				first.isProcessed = true;
				last.isProcessed = true;

				LavUtil.removeFromLav(first);
				LavUtil.removeFromLav(last);
			}
		}
	}

	private static removeEmptyLav(sLav: HashSet<CircularList<Vertex>>) {
		sLav.removeWhere(circularList => circularList.Size === 0);
	}

	private static multiEdgeEvent(event: MultiEdgeEvent, queue: PriorityQueue<SkeletonEvent>, edges: List<Edge>) {
		const center = event.v;
		const edgeList = event.chain.edgeList;

		const previousVertex = event.chain.previousVertex;
		previousVertex.isProcessed = true;

		const nextVertex = event.chain.nextVertex;
		nextVertex.isProcessed = true;

		const bisector = this.calcBisector(center, previousVertex.previousEdge, nextVertex.nextEdge);
		const edgeVertex = new Vertex(center, event.distance, bisector, previousVertex.previousEdge,
			nextVertex.nextEdge);

		this.addFaceLeft(edgeVertex, previousVertex);

		this.addFaceRight(edgeVertex, nextVertex);

		previousVertex.addPrevious(edgeVertex);

		this.addMultiBackFaces(edgeList, edgeVertex);

		this.computeEvents(edgeVertex, queue, edges);
	}

	private static addMultiBackFaces(edgeList: List<EdgeEvent>, edgeVertex: Vertex) {
		for (const edgeEvent of edgeList) {
			const leftVertex = edgeEvent.previousVertex;
			leftVertex.isProcessed = true;
			LavUtil.removeFromLav(leftVertex);

			const rightVertex = edgeEvent.nextVertex;
			rightVertex.isProcessed = true;
			LavUtil.removeFromLav(rightVertex);

			this.addFaceBack(edgeVertex, leftVertex, rightVertex);
		}
	}

	private static pickEvent(event: PickEvent) {
		const center = event.v;
		const edgeList = event.chain.edgeList;

		const vertex = new Vertex(center, event.distance, LineParametric2d.Empty, null, null);
		vertex.isProcessed = true;

		this.addMultiBackFaces(edgeList, vertex);
	}

	private static multiSplitEvent(event: MultiSplitEvent, sLav: HashSet<CircularList<Vertex>>, queue: PriorityQueue<SkeletonEvent>, edges: List<Edge>) {
		const chains = event.chains;
		const center = event.v;

		this.createOppositeEdgeChains(sLav, chains, center);

		chains.sort(new ChainComparer(center));

		let lastFaceNode: FaceNode = null;

		let edgeListSize = chains.count;
		for (let i = 0; i < edgeListSize; i++) {
			const chainBegin = chains[i];
			const chainEnd = chains[(i + 1) % edgeListSize];

			const newVertex = this.createMultiSplitVertex(chainBegin.nextEdge, chainEnd.previousEdge, center, event.distance);

			const beginNextVertex = chainBegin.nextVertex;
			const endPreviousVertex = chainEnd.previousVertex;

			this.correctBisectorDirection(newVertex.bisector, beginNextVertex, endPreviousVertex, chainBegin.nextEdge, chainEnd.previousEdge);

			if (LavUtil.isSameLav(beginNextVertex, endPreviousVertex)) {
				const lavPart = LavUtil.cutLavPart(beginNextVertex, endPreviousVertex);

				const lav = new CircularList<Vertex>();
				sLav.add(lav);
				lav.addLast(newVertex);
				for (const vertex of lavPart) {
					lav.addLast(vertex);
				}
			}
			else {
				LavUtil.mergeBeforeBaseVertex(beginNextVertex, endPreviousVertex);
				endPreviousVertex.addNext(newVertex);
			}

			this.computeEvents(newVertex, queue, edges);
			lastFaceNode = this.addSplitFaces(lastFaceNode, chainBegin, chainEnd, newVertex);
		}

		edgeListSize = chains.count;
		for (let i = 0; i < edgeListSize; i++) {
			const chainBegin = chains[i];
			const chainEnd = chains[(i + 1) % edgeListSize];

			LavUtil.removeFromLav(chainBegin.currentVertex);
			LavUtil.removeFromLav(chainEnd.currentVertex);

			if (chainBegin.currentVertex !== null) {
				chainBegin.currentVertex.isProcessed = true;
			}
			if (chainEnd.currentVertex !== null) {
				chainEnd.currentVertex.isProcessed = true;
			}
		}
	}

	private static correctBisectorDirection(bisector: LineParametric2d, beginNextVertex: Vertex, endPreviousVertex: Vertex, beginEdge: Edge, endEdge: Edge) {
		const beginEdge2 = beginNextVertex.previousEdge;
		const endEdge2 = endPreviousVertex.nextEdge;

		if (beginEdge !== beginEdge2 || endEdge !== endEdge2) {
			throw new Error();
		}

		if (beginEdge.norm.dot(endEdge.norm) < -0.97) {
			const n1 = PrimitiveUtils.fromTo(endPreviousVertex.point, bisector.A).normalized();
			const n2 = PrimitiveUtils.fromTo(bisector.A, beginNextVertex.point).normalized();
			const bisectorPrediction = this.calcVectorBisector(n1, n2);

			if (bisector.U.dot(bisectorPrediction) < 0) {
				bisector.U.negate();
			}
		}
	}

	private static addSplitFaces(lastFaceNode: FaceNode, chainBegin: IChain, chainEnd: IChain, newVertex: Vertex): FaceNode {
		if (chainBegin instanceof SingleEdgeChain) {
			if (lastFaceNode === null) {
				const beginVertex = this.createOppositeEdgeVertex(newVertex);

				newVertex.rightFace = beginVertex.rightFace;
				lastFaceNode = beginVertex.leftFace;
			}
			else {
				if (newVertex.rightFace !== null) {
					throw new Error("newVertex.RightFace should be null");
				}

				newVertex.rightFace = lastFaceNode;
				lastFaceNode = null;
			}
		}
		else {
			const beginVertex = chainBegin.currentVertex;
			this.addFaceRight(newVertex, beginVertex);
		}

		if (chainEnd instanceof SingleEdgeChain) {
			if (lastFaceNode === null) {
				const endVertex = this.createOppositeEdgeVertex(newVertex);

				newVertex.leftFace = endVertex.leftFace;
				lastFaceNode = endVertex.leftFace;
			}
			else {
				if (newVertex.leftFace !== null) {
					throw new Error("newVertex.LeftFace should be null.");
				}
				newVertex.leftFace = lastFaceNode;

				lastFaceNode = null;
			}
		}
		else {
			const endVertex = chainEnd.currentVertex;
			this.addFaceLeft(newVertex, endVertex);
		}
		return lastFaceNode;
	}

	private static createOppositeEdgeVertex(newVertex: Vertex): Vertex {
		const vertex = new Vertex(
			newVertex.point,
			newVertex.distance,
			newVertex.bisector,
			newVertex.previousEdge,
			newVertex.nextEdge
		);

		const fn = new FaceNode(vertex);
		vertex.leftFace = fn;
		vertex.rightFace = fn;

		const rightFace = new FaceQueue();
		rightFace.addFirst(fn);

		return vertex;
	}

	private static createOppositeEdgeChains(sLav: HashSet<CircularList<Vertex>>, chains: List<IChain>, center: Vector2d) {
		const oppositeEdges = new HashSet<Edge>();

		const oppositeEdgeChains = new List<IChain>();
		const chainsForRemoval = new List<IChain>();

		for (const chain of chains) {
			if (chain instanceof SplitChain) {
				const splitChain = <SplitChain>chain;
				const oppositeEdge = splitChain.OppositeEdge;

				if (oppositeEdge !== null && !oppositeEdges.contains(oppositeEdge)) {
					const nextVertex = this.findOppositeEdgeLav(sLav, oppositeEdge, center);

					if (nextVertex !== null) {
						oppositeEdgeChains.add(new SingleEdgeChain(oppositeEdge, nextVertex));
					}
					else {
						this.findOppositeEdgeLav(sLav, oppositeEdge, center);
						chainsForRemoval.add(chain);
					}
					oppositeEdges.add(oppositeEdge);
				}
			}
		}

		for (let chain of chainsForRemoval) {
			chains.remove(chain);
		}

		chains.addRange(oppositeEdgeChains);
	}

	private static createMultiSplitVertex(nextEdge: Edge, previousEdge: Edge, center: Vector2d, distance: number): Vertex {
		const bisector = this.calcBisector(center, previousEdge, nextEdge);
		return new Vertex(center, distance, bisector, previousEdge, nextEdge);
	}

	private static createChains(cluster: List<SkeletonEvent>): List<IChain> {
		const edgeCluster = new List<EdgeEvent>();
		const splitCluster = new List<SplitEvent>();
		const vertexEventsParents = new HashSet<Vertex>();

		for (const skeletonEvent of cluster) {
			if (skeletonEvent instanceof EdgeEvent) {
				edgeCluster.add(<EdgeEvent>skeletonEvent);
			}
			else {
				if (skeletonEvent instanceof VertexSplitEvent) {

				}
				else if (skeletonEvent instanceof SplitEvent) {
					const splitEvent = <SplitEvent>skeletonEvent;
					vertexEventsParents.add(splitEvent.parent);
					splitCluster.add(splitEvent);
				}
			}
		}

		for (let skeletonEvent of cluster) {
			if (skeletonEvent instanceof VertexSplitEvent) {
				const vertexEvent = <VertexSplitEvent>skeletonEvent;
				if (!vertexEventsParents.contains(vertexEvent.parent)) {
					vertexEventsParents.add(vertexEvent.parent);
					splitCluster.add(vertexEvent);
				}
			}
		}

		const edgeChains = new List<EdgeChain>();

		while (edgeCluster.count > 0) {
			edgeChains.add(new EdgeChain(this.createEdgeChain(edgeCluster)));
		}

		const chains = new List<IChain>(edgeChains.count);
		for (const edgeChain of edgeChains) {
			chains.add(edgeChain);
		}

		splitEventLoop:
			while (splitCluster.any()) {
				const split = splitCluster[0];
				splitCluster.removeAt(0);

				for (const chain of edgeChains) {
					if (this.isInEdgeChain(split, chain)) {
						continue splitEventLoop; //goto splitEventLoop;
					}
				}

				chains.add(new SplitChain(split));
			}

		return chains;
	}

	private static isInEdgeChain(split: SplitEvent, chain: EdgeChain): boolean {
		const splitParent = split.parent;
		const edgeList = chain.edgeList;

		return edgeList.any(edgeEvent => edgeEvent.previousVertex === splitParent || edgeEvent.nextVertex === splitParent);
	}

	private static createEdgeChain(edgeCluster: List<EdgeEvent>): List<EdgeEvent> {
		const edgeList = new List<EdgeEvent>();

		edgeList.add(edgeCluster[0]);
		edgeCluster.removeAt(0);

		loop:
			for (; ;) {
				const beginVertex = edgeList[0].previousVertex;
				const endVertex = edgeList[edgeList.count - 1].nextVertex;

				for (let i = 0; i < edgeCluster.count; i++) {
					const edge = edgeCluster[i];
					if (edge.previousVertex === endVertex) {
						edgeCluster.removeAt(i);
						edgeList.add(edge);
						
						//goto loop;
						continue loop;

					}
					if (edge.nextVertex === beginVertex) {
						edgeCluster.removeAt(i);
						edgeList.insert(0, edge);
						
						//goto loop;
						continue loop;
					}
				}
				break;
			}

		return edgeList;
	}

	private static removeEventsUnderHeight(queue: PriorityQueue<SkeletonEvent>, levelHeight: number) {
		while (!queue.empty) {
			if (queue.peek().distance > levelHeight + this.splitEpsilon) {
				break;
			}
			queue.next();
		}
	}

	private static loadAndGroupLevelEvents(queue: PriorityQueue<SkeletonEvent>): List<SkeletonEvent> {
		const levelEvents = this.loadLevelEvents(queue);
		return this.groupLevelEvents(levelEvents);
	}

	private static groupLevelEvents(levelEvents: List<SkeletonEvent>): List<SkeletonEvent> {
		const ret = new List<SkeletonEvent>();

		const parentGroup = new HashSet<Vertex>();

		while (levelEvents.count > 0) {
			parentGroup.clear();

			const event = levelEvents[0];
			levelEvents.removeAt(0);
			const eventCenter = event.v;
			const distance = event.distance;

			this.addEventToGroup(parentGroup, event);

			const cluster = new List<SkeletonEvent>();
			cluster.add(event);

			for (let j = 0; j < levelEvents.count; j++) {
				const test = levelEvents[j];

				if (this.isEventInGroup(parentGroup, test)) {
					const item = levelEvents[j];
					levelEvents.removeAt(j);
					cluster.add(item);
					this.addEventToGroup(parentGroup, test);
					j--;
				}
				else if (eventCenter.distanceTo(test.v) < this.splitEpsilon) {
					const item = levelEvents[j];
					levelEvents.removeAt(j);
					cluster.add(item);
					this.addEventToGroup(parentGroup, test);
					j--;
				}
			}

			ret.add(this.createLevelEvent(eventCenter, distance, cluster));
		}
		return ret;
	}

	private static isEventInGroup(parentGroup: HashSet<Vertex>, event: SkeletonEvent): boolean {
		if (event instanceof SplitEvent) {
			return parentGroup.contains((<SplitEvent>event).parent);
		}
		if (event instanceof EdgeEvent) {
			return parentGroup.contains((<EdgeEvent>event).previousVertex) || parentGroup.contains((<EdgeEvent>event).nextVertex);
		}
		return false;
	}

	private static addEventToGroup(parentGroup: HashSet<Vertex>, event: SkeletonEvent) {
		if (event instanceof SplitEvent) {
			parentGroup.add((<SplitEvent>event).parent);
		}
		else if (event instanceof EdgeEvent) {
			parentGroup.add((<EdgeEvent>event).previousVertex);
			parentGroup.add((<EdgeEvent>event).nextVertex);
		}
	}

	private static createLevelEvent(eventCenter: Vector2d, distance: number, eventCluster: List<SkeletonEvent>): SkeletonEvent {
		const chains = this.createChains(eventCluster);

		if (chains.count === 1) {
			const chain = chains[0];
			if (chain.chainType === ChainType.ClosedEdge) {
				return new PickEvent(eventCenter, distance, <EdgeChain>chain);
			}
			if (chain.chainType === ChainType.Edge) {
				return new MultiEdgeEvent(eventCenter, distance, <EdgeChain>chain);
			}
			if (chain.chainType === ChainType.Split) {
				return new MultiSplitEvent(eventCenter, distance, chains);
			}
		}

		if (chains.any(chain => chain.chainType === ChainType.ClosedEdge)) {
			throw new Error("Found closed chain of events for single point, but found more then one chain");
		}
		return new MultiSplitEvent(eventCenter, distance, chains);
	}

	private static loadLevelEvents(queue: PriorityQueue<SkeletonEvent>): List<SkeletonEvent> {
		const level = new List<SkeletonEvent>();
		let levelStart: SkeletonEvent;

		do {
			levelStart = queue.empty ? null : queue.next();
		}
		while (levelStart !== null && levelStart.isObsolete);


		if (levelStart === null || levelStart.isObsolete) {
			return level;
		}

		const levelStartHeight = levelStart.distance;

		level.add(levelStart);

		let event: SkeletonEvent;
		while ((event = queue.peek()) !== null &&
		Math.abs(event.distance - levelStartHeight) < this.splitEpsilon) {
			const nextLevelEvent = queue.next();
			if (!nextLevelEvent.isObsolete) {
				level.add(nextLevelEvent);
			}
		}
		return level;
	}

	private static assertMaxNumberOfInteraction(count: number): number {
		count++;
		if (count > 10000) {
			throw new Error("Too many interactions: bug?");
		}
		return count;
	}

	private static makeClockwise(holes: List<List<Vector2d>>): List<List<Vector2d>> {
		if (holes === null) {
			return null;
		}

		const ret = new List<List<Vector2d>>(holes.count);
		for (const hole of holes) {
			if (PrimitiveUtils.isClockwisePolygon(hole)) {
				ret.add(hole);
			}
			else {
				hole.reverse();
				ret.add(hole);
			}
		}
		return ret;
	}

	private static makeCounterClockwise(polygon: List<Vector2d>): List<Vector2d> {
		return PrimitiveUtils.makeCounterClockwise(polygon);
	}

	private static initSlav(polygon: List<Vector2d>, sLav: HashSet<CircularList<Vertex>>, edges: List<Edge>, faces: List<FaceQueue>) {
		const edgesList = new CircularList<Edge>();

		const size = polygon.count;
		for (let i = 0; i < size; i++) {
			const j = (i + 1) % size;
			edgesList.addLast(new Edge(polygon[i], polygon[j]));
		}

		for (const edge of edgesList.Iterate()) {
			const nextEdge = edge.next as Edge;
			const bisector = this.calcBisector(edge.end, edge, nextEdge);

			edge.bisectorNext = bisector;
			nextEdge.bisectorPrevious = bisector;
			edges.add(edge);
		}

		const lav = new CircularList<Vertex>();
		sLav.add(lav);

		for (const edge of edgesList.Iterate()) {
			const nextEdge = edge.next as Edge;
			const vertex = new Vertex(edge.end, 0, edge.bisectorNext, edge, nextEdge);
			lav.addLast(vertex);
		}

		for (const vertex of lav.Iterate()) {
			const next = vertex.next as Vertex;
			const rightFace = new FaceNode(vertex);

			const faceQueue = new FaceQueue();
			faceQueue.edge = (vertex.nextEdge);

			faceQueue.addFirst(rightFace);
			faces.add(faceQueue);
			vertex.rightFace = rightFace;

			const leftFace = new FaceNode(next);
			rightFace.addPush(leftFace);
			next.leftFace = leftFace;
		}
	}

	private static addFacesToOutput(faces: List<FaceQueue>): StraightSkeleton {
		const edgeOutputs = new List<EdgeResult>();
		const distances = new Dictionary<Vector2d, number>();

		for (const face of faces) {
			if (face.size > 0) {
				const faceList = new List<Vector2d>();

				for (const fn of face.iterate()) {
					const point = fn.vertex.point;

					faceList.add(point);

					if (!distances.containsKey(point)) {	
						distances.add(point, fn.vertex.distance);
					}
				}

				edgeOutputs.add(new EdgeResult(face.edge, faceList));
			}
		}
		return new StraightSkeleton(edgeOutputs, distances);
	}

	private static initEvents(sLav: HashSet<CircularList<Vertex>>, queue: PriorityQueue<SkeletonEvent>, edges: List<Edge>) {
		for (const lav of sLav) {
			for (const vertex of lav.Iterate()) {
				this.computeSplitEvents(vertex, edges, queue, -1);
			}
		}

		for (const lav of sLav) {
			for (const vertex of lav.Iterate()) {
				const nextVertex = vertex.next as Vertex;
				this.computeEdgeEvents(vertex, nextVertex, queue);
			}
		}
	}

	private static computeSplitEvents(vertex: Vertex, edges: List<Edge>, queue: PriorityQueue<SkeletonEvent>, distanceSquared: number) {
		const source = vertex.point;
		const oppositeEdges = this.calcOppositeEdges(vertex, edges);

		for (const oppositeEdge of oppositeEdges) {
			const point = oppositeEdge.point;

			if (Math.abs(distanceSquared - (-1)) > this.splitEpsilon) {
				if (source.distanceSquared(point) > distanceSquared + this.splitEpsilon) {
					continue;
				}
			}

			if (oppositeEdge.oppositePoint.notEquals(Vector2d.Empty)) {
				queue.add(new VertexSplitEvent(point, oppositeEdge.distance, vertex));
				continue;
			}
			queue.add(new SplitEvent(point, oppositeEdge.distance, vertex, oppositeEdge.oppositeEdge));
		}
	}

	private static computeEvents(vertex: Vertex, queue: PriorityQueue<SkeletonEvent>, edges: List<Edge>) {
		const distanceSquared = this.computeCloserEdgeEvent(vertex, queue);
		this.computeSplitEvents(vertex, edges, queue, distanceSquared);
	}

	private static computeCloserEdgeEvent(vertex: Vertex, queue: PriorityQueue<SkeletonEvent>): number {
		const nextVertex = vertex.next as Vertex;
		const previousVertex = vertex.previous as Vertex;

		const point = vertex.point;

		const point1 = this.computeIntersectionBisectors(vertex, nextVertex);
		const point2 = this.computeIntersectionBisectors(previousVertex, vertex);

		if (point1.equals(Vector2d.Empty) && point2.equals(Vector2d.Empty)) {
			return -1;
		}

		let distance1 = Number.MAX_VALUE;
		let distance2 = Number.MAX_VALUE;

		if (point1.notEquals(Vector2d.Empty)) {	
			distance1 = point.distanceSquared(point1);
		}
		if (point2.notEquals(Vector2d.Empty)) {
			distance2 = point.distanceSquared(point2);
		}

		if (Math.abs(distance1 - this.splitEpsilon) < distance2) {
			queue.add(this.createEdgeEvent(point1, vertex, nextVertex));
		}
		if (Math.abs(distance2 - this.splitEpsilon) < distance1) {
			queue.add(this.createEdgeEvent(point2, previousVertex, vertex));
		}

		return distance1 < distance2 ? distance1 : distance2;
	}

	private static createEdgeEvent(point: Vector2d, previousVertex: Vertex, nextVertex: Vertex): SkeletonEvent {
		return new EdgeEvent(point, this.calcDistance(point, previousVertex.nextEdge), previousVertex, nextVertex);
	}

	private static computeEdgeEvents(previousVertex: Vertex, nextVertex: Vertex, queue: PriorityQueue<SkeletonEvent>) {
		const point = this.computeIntersectionBisectors(previousVertex, nextVertex);
		if (point.notEquals(Vector2d.Empty)) {
			queue.add(this.createEdgeEvent(point, previousVertex, nextVertex));
		}
	}

	private static calcOppositeEdges(vertex: Vertex, edges: List<Edge>): List<SplitCandidate> {
		const ret = new List<SplitCandidate>();

		for (const edgeEntry of edges) {
			const edge = edgeEntry.lineLinear2d;

			if (this.edgeBehindBisector(vertex.bisector, edge)) {
				continue;
			}

			const candidatePoint = this.calcCandidatePointForSplit(vertex, edgeEntry);
			if (candidatePoint !== null) {
				ret.add(candidatePoint);
			}
		}

		ret.sort(new SplitCandidateComparer());
		return ret;
	}

	private static edgeBehindBisector(bisector: LineParametric2d, edge: LineLinear2d): boolean {
		return LineParametric2d.collide(bisector, edge, this.splitEpsilon).equals(Vector2d.Empty);
	}

	private static calcCandidatePointForSplit(vertex: Vertex, edge: Edge): SplitCandidate {
		const vertexEdge = this.choseLessParallelVertexEdge(vertex, edge);
		if (vertexEdge === null) {
			return null;
		}

		const vertexEdteNormNegate = vertexEdge.norm;
		const edgesBisector = this.calcVectorBisector(vertexEdteNormNegate, edge.norm);
		const edgesCollide = vertexEdge.lineLinear2d.collide(edge.lineLinear2d);

		if (edgesCollide.equals(Vector2d.Empty)) {
			throw new Error("Ups this should not happen");
		}

		const edgesBisectorLine = new LineParametric2d(edgesCollide, edgesBisector).createLinearForm();

		const candidatePoint = LineParametric2d.collide(vertex.bisector, edgesBisectorLine, this.splitEpsilon);

		if (candidatePoint.equals(Vector2d.Empty))
			return null;

		if (edge.bisectorPrevious.isOnRightSide(candidatePoint, this.splitEpsilon) && edge.bisectorNext.isOnLeftSide(candidatePoint, this.splitEpsilon)) {
			const distance = this.calcDistance(candidatePoint, edge);

			if (edge.bisectorPrevious.isOnLeftSide(candidatePoint, this.splitEpsilon)) {
				return new SplitCandidate(candidatePoint, distance, null, edge.begin);
			}
			if (edge.bisectorNext.isOnRightSide(candidatePoint, this.splitEpsilon)) {
				return new SplitCandidate(candidatePoint, distance, null, edge.begin);
			}

			return new SplitCandidate(candidatePoint, distance, edge, Vector2d.Empty);
		}

		return null;
	}

	private static choseLessParallelVertexEdge(vertex: Vertex, edge: Edge): Edge {
		const edgeA = vertex.previousEdge;
		const edgeB = vertex.nextEdge;

		let vertexEdge = edgeA;

		const edgeADot = Math.abs(edge.norm.dot(edgeA.norm));
		const edgeBDot = Math.abs(edge.norm.dot(edgeB.norm));

		if (edgeADot + edgeBDot >= 2 - this.splitEpsilon) {
			return null;
		}

		if (edgeADot > edgeBDot) {
			vertexEdge = edgeB;
		}

		return vertexEdge;
	}

	private static computeIntersectionBisectors(vertexPrevious: Vertex, vertexNext: Vertex): Vector2d {
		const bisectorPrevious = vertexPrevious.bisector;
		const bisectorNext = vertexNext.bisector;

		const intersectRays2d = PrimitiveUtils.intersectRays2D(bisectorPrevious, bisectorNext);
		const intersect = intersectRays2d.Intersect;

		if (vertexPrevious.point.equals(intersect) || vertexNext.point.equals(intersect)) {
			return Vector2d.Empty;
		}

		return intersect;
	}

	private static findOppositeEdgeLav(sLav: HashSet<CircularList<Vertex>>, oppositeEdge: Edge, center: Vector2d): Vertex {
		const edgeLavs = this.findEdgeLavs(sLav, oppositeEdge, null);
		return this.chooseOppositeEdgeLav(edgeLavs, oppositeEdge, center);
	}

	private static chooseOppositeEdgeLav(edgeLavs: List<Vertex>, oppositeEdge: Edge, center: Vector2d): Vertex {
		if (!edgeLavs.any()) {
			return null;
		}

		if (edgeLavs.count === 1) {
			return edgeLavs[0];
		}

		const edgeStart = oppositeEdge.begin;
		const edgeNorm = oppositeEdge.norm;
		const centerVector = center.sub(edgeStart);
		const centerDot = edgeNorm.dot(centerVector);
		
		for (const end of edgeLavs) {
			const begin = end.previous as Vertex;

			const beginVector = begin.point.sub(edgeStart);
			const endVector = end.point.sub(edgeStart);

			const beginDot = edgeNorm.dot(beginVector);
			const endDot = edgeNorm.dot(endVector);

			if (beginDot < centerDot && centerDot < endDot || beginDot > centerDot && centerDot > endDot) {
				return end;
			}
		}

		for (const end of edgeLavs) {
			const size = end.list.Size;
			const points = new List<Vector2d>(size);
			let next = end;
			for (let i = 0; i < size; i++) {
				points.add(next.point);
				next = next.next as Vertex;
			}
			if (PrimitiveUtils.isPointInsidePolygon(center, points)) {
				return end;
			}
		}
		throw new Error("Could not find lav for opposite edge, it could be correct but need some test data to check.");
	}

	private static findEdgeLavs(sLav: HashSet<CircularList<Vertex>>, oppositeEdge: Edge, skippedLav: CircularList<Vertex>): List<Vertex> {
		const edgeLavs = new List<Vertex>();
		for (const lav of sLav) {
			if (lav === skippedLav) {
				continue;
			}

			const vertexInLav = this.getEdgeInLav(lav, oppositeEdge);
			if (vertexInLav !== null) {
				edgeLavs.add(vertexInLav);
			}
		}
		return edgeLavs;
	}

	private static getEdgeInLav(lav: CircularList<Vertex>, oppositeEdge: Edge): Vertex {
		for (const node of lav.Iterate()) {
			if (oppositeEdge === node.previousEdge ||oppositeEdge === node.previous.next) {
				return node;
			}
		}

		return null;
	}

	private static addFaceBack(newVertex: Vertex, va: Vertex, vb: Vertex) {
		const fn = new FaceNode(newVertex);
		va.rightFace.addPush(fn);
		FaceQueueUtil.connectQueues(fn, vb.leftFace);
	}

	private static addFaceRight(newVertex: Vertex, vb: Vertex) {
		const fn = new FaceNode(newVertex);
		vb.rightFace.addPush(fn);
		newVertex.rightFace = fn;
	}

	private static addFaceLeft(newVertex: Vertex, va: Vertex) {
		const fn = new FaceNode(newVertex);
		va.leftFace.addPush(fn);
		newVertex.leftFace = fn;
	}

	private static calcDistance(intersect: Vector2d, currentEdge: Edge): number {
		const edge = currentEdge.end.sub(currentEdge.begin);
		const vector = intersect.sub(currentEdge.begin);

		const pointOnVector = PrimitiveUtils.orthogonalProjection(edge, vector);
		return vector.distanceTo(pointOnVector);
	}

	private static calcBisector(p: Vector2d, e1: Edge, e2: Edge): LineParametric2d {
		const norm1 = e1.norm;
		const norm2 = e2.norm;

		const bisector = this.calcVectorBisector(norm1, norm2);
		return new LineParametric2d(p, bisector);
	}

	private static calcVectorBisector(norm1: Vector2d, norm2: Vector2d): Vector2d {
		return PrimitiveUtils.bisectorNormalized(norm1, norm2);
	}
}

class SkeletonEventDistanseComparer implements IComparer<SkeletonEvent> {
	public compare(left: SkeletonEvent, right: SkeletonEvent): number {
		if (left.distance > right.distance) {
			return 1;
		}
		if (left.distance < right.distance) {
			return -1;
		}

		return 0;
	}
}

class ChainComparer implements IComparer<IChain> {
	private readonly _center: Vector2d;

	constructor(center: Vector2d) {
		this._center = center;
	}

	public compare(x: IChain, y: IChain): number {
		if (x === y) {
			return 0;
		}

		const angle1 = ChainComparer.angle(this._center, x.previousEdge.begin);
		const angle2 = ChainComparer.angle(this._center, y.previousEdge.begin);

		return angle1 > angle2 ? 1 : -1;
	}

	private static angle(p0: Vector2d, p1: Vector2d): number {
		const dx = p1.x - p0.x;
		const dy = p1.y - p0.y;
		return Math.atan2(dy, dx);
	}
}

class SplitCandidateComparer implements IComparer<SplitCandidate> {
	public compare(left: SplitCandidate, right: SplitCandidate): number {
		if (left.distance > right.distance) {
			return 1;
		}
		if (left.distance < right.distance) {
			return -1;
		}

		return 0;
	}
}

class SplitCandidate {
	public readonly distance: number;
	public readonly oppositeEdge: Edge = null;
	public readonly oppositePoint: Vector2d = null;
	public readonly point: Vector2d = null;

	constructor(point: Vector2d, distance: number, oppositeEdge: Edge, oppositePoint: Vector2d) {
		this.point = point;
		this.distance = distance;
		this.oppositeEdge = oppositeEdge;
		this.oppositePoint = oppositePoint;
	}
}

