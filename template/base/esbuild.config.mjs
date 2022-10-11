import * as esbuild from 'esbuild'
import { createServer, request} from "http";
import { spawn } from 'child_process'
import { networkInterfaces } from 'os';

const getIp = () =>
    Object.values(networkInterfaces())
        .flat()
        .find(ip => ip.family === 'IPv4' && !ip.internal).address;

const PORT = 3000

const EVENT_WATCH = '/event_watch'

const clients = []

await esbuild.build({
    entryPoints: ['src/index.js'],
    bundle: true,
    outdir: 'out',
    banner: {
        // todo websocket support
        js: ` (() => new EventSource("${EVENT_WATCH}").onmessage = () => location.reload())();`,
    },
    watch: {
        onRebuild(error, result) {
            if (error) console.error('watch build failed:', error)
            else console.log('watch build succeeded:', result)

            clients.forEach((res) => res.write("data: update\n\n"));
            clients.length = 0;
            error && console.log(error);
        }
    }
}).catch(() => process.exit(1))

esbuild.serve({ servedir: './' }, {}).then((result) => {
    // The result tells us where esbuild's local server is
    const {host, port} = result

    createServer((req, res) => {
        // For watch to hot reload.
        if (req.url === EVENT_WATCH) {
            const client = res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive'
            });
            return clients.push(client)
        }

        const url = {
            hostname: host,
            port: port,
            path: req.url,
            method: req.method,
            headers: req.headers,
        }

        // Forward each incoming request to esbuild
        const proxyReq = request(url, proxyRes => {
            // If esbuild returns "not found", send a custom 404 page
            if (proxyRes.statusCode === 404) {
                res.writeHead(404, { 'Content-Type': 'text/html' });
                res.end('<h1>A custom 404 page</h1>');
                return;
            }

            // Otherwise, forward the response from esbuild to the client
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            proxyRes.pipe(res, { end: true });
        });

        // Forward the body of the request to esbuild
        req.pipe(proxyReq, { end: true });
    }).listen(PORT)

    // todo console.error(`Port ${port} was in use.\n`)
    const localhost = `http://localhost:${PORT}`
    console.log('\nServing 🍛\n');
    console.log(`Local → ${localhost}\n`);
    console.log(`Network → http://${getIp()}:${PORT}\n`);

    setTimeout(() => {
        const op = { darwin: ['open'], linux: ['xdg-open'], win32: ['cmd', '/c', 'start'] }
        const ptf = process.platform
        if (clients.length === 0) spawn(op[ptf][0], [...[op[ptf].slice(1)], localhost])
    }, 1000) //open the default browser only if it is not opened yet
})
