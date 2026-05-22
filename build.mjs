// Build pipeline for Shipyard JS.
//
// Reads every .js file from assets/js/source/, runs esbuild per-file
// (minify + source map, no bundling — these are global-script files,
// not ES modules), and writes minified output + .js.map alongside in
// assets/js/. The output directory is gitignored; CI rebuilds on each
// tag push.
//
// Usage:
//   node build.mjs           one-shot build (used in CI + local)
//   node build.mjs --watch   rebuild on source change (local dev)

import * as esbuild from 'esbuild';
import { readdirSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const SOURCE_DIR = 'assets/js/source';
const OUT_DIR = 'assets/js';
const WATCH = process.argv.includes('--watch');

if (!existsSync(SOURCE_DIR)) {
    console.error(`Source dir ${SOURCE_DIR} not found.`);
    process.exit(1);
}
mkdirSync(OUT_DIR, { recursive: true });

const entryPoints = readdirSync(SOURCE_DIR)
    .filter((f) => f.endsWith('.js'))
    .map((f) => join(SOURCE_DIR, f));

if (entryPoints.length === 0) {
    console.error(`No .js files found in ${SOURCE_DIR}.`);
    process.exit(1);
}

const buildOptions = {
    entryPoints,
    outdir: OUT_DIR,
    bundle: false,
    minify: true,
    sourcemap: true,
    target: 'es2017',
    logLevel: 'info',
    legalComments: 'none',
};

if (WATCH) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    console.log(`Watching ${entryPoints.length} files in ${SOURCE_DIR}...`);
} else {
    await esbuild.build(buildOptions);
    console.log(`Built ${entryPoints.length} files into ${OUT_DIR}/`);
}
