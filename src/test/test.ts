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

test("straight-skeleton-geojson - Floating point epsilon handling", (t) => {
    const poly: MultiPolygon = {
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

    t.doesNotThrow(() => SkeletonBuilder.buildFromGeoJSON(poly));
    t.end();
});