import { StraightSkeletonBuilder } from "../lib/index";
import { MultiPolygon } from "geojson";
// import fs from "fs";
import test from "tape";
import path from "path";
import { fileURLToPath } from "url";
// import { loadJsonFileSync } from "load-json-file";
// import { writeJsonFileSync } from "write-json-file";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const directories = {
    in: path.join(__dirname, "in"),
    out: path.join(__dirname, "out"),
};

// var fixtures = fs.readdirSync(directories.in).map((filename) => {
//     return {
//         filename,
//         name: path.parse(filename).name,
//         geojson: loadJsonFileSync(path.join(directories.in, filename)),
//     };
// });

test("straight-skeleton-geojson - Floating point epsilon handling at different scales", (t) => {
    const poly1: MultiPolygon = {
        type: "MultiPolygon",
        coordinates: [
            [
                [
                    [-0.0002200085430165132, 0.000806050096020618],
                    [-0.0004322383282246447, 0.0006936438066656281],
                    [-0.00043967527961409397, 0.0004816906922093666],
                    [-0.00017790995318322652, 0.0005167726431738992],
                    [-0.0002200085430165132, 0.000806050096020618]
                ]
            ]
        ]
    };

    t.doesNotThrow(() => StraightSkeletonBuilder.buildFromGeoJSON(poly1));

    const poly2: MultiPolygon = {
        type: "MultiPolygon",
        coordinates: [
            [
                [
                    [-0.2200085430165132, 0.806050096020618],
                    [-0.4322383282246447, 0.6936438066656281],
                    [-0.43967527961409397, 0.4816906922093666],
                    [-0.17790995318322652, 0.5167726431738992],
                    [-0.2200085430165132, 0.806050096020618]
                ]
            ]
        ]
    };

    t.doesNotThrow(() => StraightSkeletonBuilder.buildFromGeoJSON(poly2));

    const poly3: MultiPolygon = {
        type: "MultiPolygon",
        coordinates: [
            [
                [
                    [-22.00085430165132, 80.6050096020618],
                    [-43.22383282246447, 69.36438066656281],
                    [-43.967527961409397, 48.16906922093666],
                    [-17.790995318322652, 51.67726431738992],
                    [-22.00085430165132, 80.6050096020618]
                ]
            ]
        ]
    };

    t.doesNotThrow(() => StraightSkeletonBuilder.buildFromGeoJSON(poly3));

    t.end();
});

test('straight-skeleton-geojson - Offset shape is a single polygon', (t) => {
    // Square shape
    const poly: MultiPolygon = {
        type: "MultiPolygon",
        coordinates: [
            [
                [
                    [0, 0],
                    [1, 0],
                    [1, 1],
                    [0, 1],
                    [0, 0]
                ]
            ]
        ]
    };
    const skeleton = StraightSkeletonBuilder.buildFromGeoJSON(poly);
    const offset = skeleton.offset(0.15);
    const expectedPoints = [
        [0.15, 0],
        [0.85, 0],
        [1, 0.15],
        [1, 0.85],
        [0.85, 1],
        [0.15, 1],
        [0, 0.85],
        [0, 0.15],
        [0.15, 0]
    ];
    t.equal(offset.type, "MultiPolygon");
    t.equal(offset.coordinates.length, 1);
    const outputPolygon = offset.coordinates[0][0];
    
    // Check if the output polygon has only the points in the expected points list
    for (const point of expectedPoints) {
        t.ok(outputPolygon.some((p: number[]) => p[0] === point[0] && p[1] === point[1]), `Point ${point} not found in output polygon`);
    }

    // Check if the output polygon is closed
    const firstPoint = outputPolygon[0];
    const lastPoint = outputPolygon[outputPolygon.length - 1];
    t.equal(firstPoint[0], lastPoint[0], "First and last points should be equal");
    t.equal(firstPoint[1], lastPoint[1], "First and last points should be equal");
   
    // Check if the output polygon has the same number of points as expected
    t.equal(outputPolygon.length, expectedPoints.length, "Output polygon should have the same number of points as expected");

    t.end();
});

test('straight-skeleton-geojson - Offset shape can be composed of multiple polygons', (t) => {
    // Bow tie shape
    const poly: MultiPolygon = {
        type: "MultiPolygon",
        coordinates: [
            [
                [
                    [0, 0],
                    [0.57, 0.49],
                    [1, 0],
                    [1, 1],
                    [0.5, 0.51],
                    [0, 1],
                    [0, 0]
                ]
            ]
        ]
    };

    const skeleton = StraightSkeletonBuilder.buildFromGeoJSON(poly);
    const offset = skeleton.offset(0.15);

    const pointsInTriangle1 = [
        [0.7345805957958975, 0.5298681089697171],
        [0.8500005201932845, 0.3983428885088353],
        [0.8500005201932845, 0.6429798106560808],
    ];

    const pointsInTriangle2 = [
        [0.3218944337967525, 0.47452242472686373],
        [0.15000020647380688, 0.6429780810845991],
        [0.15000020647380688, 0.32675434948957693],
    ];

    t.equal(offset.type, "MultiPolygon");

    if (offset.coordinates.length !== 2) {
        t.fail("Expected two polygons in the offset result");
        t.end();
        return;
    }

    const outputTriangle1 = offset.coordinates[0][0];
    const outputTriangle2 = offset.coordinates[1][0];

    // Check if the output triangles have only the points in the expected points lists
    for (const point of pointsInTriangle1) {
        t.ok(outputTriangle1.some((p: number[]) => p[0] === point[0] && p[1] === point[1]), `Point ${point} not found in triangle 1`);
    }
    for (const point of pointsInTriangle2) {
        t.ok(outputTriangle2.some((p: number[]) => p[0] === point[0] && p[1] === point[1]), `Point ${point} not found in triangle 2`);
    }

    t.end();
});