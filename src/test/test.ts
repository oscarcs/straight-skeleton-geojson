import { SkeletonBuilder } from "../lib/index";
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

    t.doesNotThrow(() => SkeletonBuilder.buildFromGeoJSON(poly1));

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

    t.doesNotThrow(() => SkeletonBuilder.buildFromGeoJSON(poly2));

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

    t.doesNotThrow(() => SkeletonBuilder.buildFromGeoJSON(poly3));

    t.end();
});