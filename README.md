# straight-skeleton-geojson

This is an adaptation of the TypeScript port of the [C# straight skeleton implementation](https://github.com/reinterpretcat/csharp-libs/tree/master/straight_skeleton) by vHawk/StrandedKitty.

From the original C# library:

> Implementation of straight skeleton algorithm for polygons with holes. It is based on concept of tracking bisector intersection with queue of events to process and circular list with processed events called lavs. This implementation is highly modified concept described by Petr Felkel and Stepan Obdrzalek. In compare to original this algorithm has new kind of event and support for multiple events which appear in the same distance from edges. It is common when processing degenerate cases caused by polygon with right angles.