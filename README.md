# straight-skeleton-geojson

This is an adaptation of the TypeScript port by vHawk/StrandedKitty of the [C# straight skeleton implementation](https://github.com/reinterpretcat/csharp-libs/tree/master/straight_skeleton).

It has been modified to input and output geojson, and mitered offset calculations are also included. The code has been cleaned up a bit and made to follow Typescript conventions more closely.

You should use this library if you need a pure Typescript implementation with few dependencies. You shouldn't use this library if robustness or accuracy are very important to you: the CGAL algorithms can be run in a browswer using wasm now.

Algorithm description from the original C# library:

> Implementation of straight skeleton algorithm for polygons with holes. It is based on concept of tracking bisector intersection with queue of events to process and circular list with processed events called lavs. This implementation is highly modified concept described by Petr Felkel and Stepan Obdrzalek. Compared to the original this algorithm has new kind of event, and support for multiple events which appear at the same distance from edges. It is common when processing degenerate cases caused by polygon with right angles.

## Example

![example image](https://i.imgur.com/9l7Qq7g.png)

## Remaining work

- Robustness improvements (& potentially use an arbitrary precision math library)
- Input polygons with holes
- Improve test suite
