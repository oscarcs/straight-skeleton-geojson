# straight-skeleton-geojson

This is an adaptation of the TypeScript port by vHawk/StrandedKitty of the [C# straight skeleton implementation](https://github.com/reinterpretcat/csharp-libs/tree/master/straight_skeleton).

It has been modified to input and output the correct geojson primitives.

From the original C# library:

> Implementation of straight skeleton algorithm for polygons with holes. It is based on concept of tracking bisector intersection with queue of events to process and circular list with processed events called lavs. This implementation is highly modified concept described by Petr Felkel and Stepan Obdrzalek. In compare to original this algorithm has new kind of event and support for multiple events which appear in the same distance from edges. It is common when processing degenerate cases caused by polygon with right angles.

## Example

![example image](https://i.imgur.com/9l7Qq7g.png)

## Remaining work

- Implement partial straight skeletons
- Add test suite
