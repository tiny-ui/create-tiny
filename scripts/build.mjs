import * as esbuild from 'esbuild'

await esbuild.build({
    entryPoints: ['index.ts'],
    bundle: true,
    outfile: 'out.js',
    platform: 'node'
}).catch((e) => process.exit(1))
