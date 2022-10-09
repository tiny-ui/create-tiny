const path = require('path');

const fs = require('fs-extra');

let json = fs.readJsonSync(path.resolve(__dirname, './app.config.json'))

let pages = json.runtime.pages;

let entry = {}

let projectPath = path.resolve(__dirname, "./")

for (let i = 0; i < pages.length; i++) {
    entry[pages[i].name] = getAbsPath(projectPath, pages[i].source);
}

module.exports = {
    mode: "development",
    devtool: 'inline-source-map',
    entry: entry,
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, './build'),
        clean: false,
    },
    resolve: {
        extensions: ['.js'],
    },
    optimization: {
        usedExports: false
    },
    module: {
        rules: [
            {
                test: /\.?js$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: [
                            [
                                "@babel/preset-env",
                                {
                                    "useBuiltIns": "entry",
                                    "exclude": ["@babel/plugin-transform-arrow-functions"]
                                }
                            ],
                            ["@babel/preset-react",
                                {
                                    "pragma": "TinyDOM.createElement",
                                    "throwIfNamespace": false,
                                    "runtime": "classic"
                                }
                            ]
                        ]
                    }
                }
            },
        ]
    }
}


function getAbsPath(project, source) {
    if ("./" === source.substring(0, 2)) {
        return project + "/" + source.substring(2)
    } else if ("../" === source.substring(0, 3)) {
        let count = 0
        let lastIndex = 0
        for (let i = 0; i < source.length; i++) {
            if (source[i] === ".") {
                if (i + 1 < source.length && source[i + 1] == ".") {
                    if (i + 2 < source.length && source[i + 2] == "/") {
                        count++;
                        lastIndex = i + 2;
                        i = i + 2;
                    }
                }
            }
        }
        for (let c = count; c > 0; c--) {
            project = project.substring(0, mLastIndex(project))
        }
        return project + source.substring(lastIndex)
    } else if ("/" === source.substring(0, 1)) {
        return source
    }
}


function mLastIndex(str) {
    for (let c = str.length; c >= 0; c--) {
        if ("/" === str[c]) {
            return c;
        }
    }
}
