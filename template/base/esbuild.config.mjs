import * as esbuild from 'esbuild'
import { createServer, request} from "http";
import { exec } from 'child_process'
import { networkInterfaces } from 'os';

const getIp = () =>
    Object.values(networkInterfaces())
        .flat()
        // Compatible ip.family in Mac OS 12.6 is 'IPv4', in Mac OS 12.3.x is 4
        .find(ip => (ip.family === 'IPv4' || ip.family === 4) && !ip.internal).address;

const EVENT_WATCH = '/event_watch'

const clients = []

await esbuild.build({
    entryPoints: ['src/index.js'],
    bundle: true,
    outdir: 'out',
    banner: {
        // Todo websocket support if
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

    const server = createServer((req, res) => {
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
                res.writeHead(404, { 'Content-Type': 'text/html' })
                res.end('<h1>A custom 404 page</h1>')
                return;
            }

            // Otherwise, forward the response from esbuild to the client
            res.writeHead(proxyRes.statusCode, proxyRes.headers)
            proxyRes.pipe(res, { end: true })
        });

        // Forward the body of the request to esbuild
        req.pipe(proxyReq, { end: true })
    }).listen(0)

    const localhost = `http://localhost:${server.address().port}`
    const network = `http://${getIp()}:${server.address().port}`
    console.log('\nServing ????\n')
    console.log(`Local ??? ${localhost}\n`)
    console.log(`Network ??? ${network}\n`)

    const cmd = (command, callback) => exec(command, function(error, stdout, stderr){ callback && callback(stdout); })

    // Open the default browser only if it is not opened yet
    const openBrowser = () => {
        cmd(`open ${localhost}`)
    };
    setTimeout(openBrowser, 1000)

    // Install apk to android device.
    // Todo show tips when command error case, such as:
    // 1. adb command not found
    // 2. adb devices not found
    // 3. adb devices multiple devices conflicts
    // 4. adb ... with other exception case.
    const installApk = () => {
        cmd('adb install -t app-debug.apk', (r1) => {
            console.log('---', 'install: ' + r1)
            const extraSource = ' -e source ' + '\"' + network + '/' + 'out/index.js' + '\"'
            const extraWatch = ' -e watch ' + '\"' + network + EVENT_WATCH + '\"'
            cmd('adb shell am start -n com.whl.tinyui.sample/com.whl.tinyui.sample.HotReloadActivity' + extraSource + extraWatch, (r2) => {
                console.log('---', 'start: ' + r2)
            })
        })
    }
    setTimeout(installApk, 200)
})
