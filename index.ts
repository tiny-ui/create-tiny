#!/usr/bin/env node

import * as fs from 'node:fs'
import * as path from 'node:path'

import prompts from 'prompts'
import { red, green, bold } from 'kolorist'

import { postOrderDirectoryTraverse, preOrderDirectoryTraverse } from './utils/directoryTraverse'
import renderTemplate from './utils/renderTemplate'
import getCommand from './utils/getCommand'
import generateReadme from './utils/generateReadme'

function isValidPackageName(projectName) {
    return /^(?:@[a-z0-9-*~][a-z0-9-*._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(projectName)
}

function toValidPackageName(projectName) {
    return projectName
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/^[._]/, '')
        .replace(/[^a-z0-9-~]+/g, '-')
}

function canSkipEmptying(dir: string) {
    if (!fs.existsSync(dir)) {
        return true
    }

    const files = fs.readdirSync(dir)
    if (files.length === 0) {
        return true
    }

    return files.length === 1 && files[0] === '.git';
}

function emptyDir(dir) {
    if (!fs.existsSync(dir)) {
        return
    }

    postOrderDirectoryTraverse(
        dir,
        (dir) => fs.rmdirSync(dir),
        (file) => fs.unlinkSync(file)
    )
}

async function init() {
    console.log('\nTiny.js\n')

    let targetDir;
    const defaultProjectName = 'tiny-project'

    let result: {
        projectName?: string
        shouldOverwrite?: string
        packageName?: string
        needsTypeScript?: string
        needsJsx?: string
    } = {}

    try {
        result = await prompts([
            {
                name: 'projectName',
                type: 'text',
                message: 'Project name:',
                initial: defaultProjectName,
                onState: (state) => (targetDir = String(state.value).trim() || defaultProjectName)
            },
            {
                name: 'shouldOverwrite',
                type: () => (canSkipEmptying(targetDir) ? null : 'confirm'),
                message: () => {
                    const dirForPrompt =
                        targetDir === '.' ? 'Current directory' : `Target directory "${targetDir}"`

                    return `${dirForPrompt} is not empty. Remove existing files and continue?`
                }
            },
            {
                name: 'overwriteChecker',
                type: (prev, values) => {
                    if (values.shouldOverwrite === false) {
                        throw new Error(red('✖') + ' Operation cancelled')
                    }
                    return null
                }
            },
            {
                name: 'packageName',
                type: () => (isValidPackageName(targetDir) ? null : 'text'),
                message: 'Package name:',
                initial: () => toValidPackageName(targetDir),
                validate: (dir) => isValidPackageName(dir) || 'Invalid package.json name'
            },
            {
                name: 'needsTypeScript',
                type: 'toggle',
                message: 'Add TypeScript?',
                initial: false,
                active: 'Yes',
                inactive: 'No'
            },
            {
                name: 'needsJsx',
                type: 'toggle',
                message: 'Add JSX Support?',
                initial: false,
                active: 'Yes',
                inactive: 'No'
            },
        ], {
            onCancel: () => {
                throw new Error(red('✖') + ' Operation cancelled')
            }})
    } catch (e) {
        console.log(e.message)
        process.exit(1)
    }

    console.log(result)

    const {
        projectName,
        shouldOverwrite,
        packageName = projectName ?? defaultProjectName,
        needsTypeScript,
        needsJsx
    } = result

    const cwd = process.cwd()
    const root = path.join(cwd, targetDir)

    if (fs.existsSync(root) && shouldOverwrite) {
        emptyDir(root)
    } else if (!fs.existsSync(root)) {
        fs.mkdirSync(root)
    }

    console.log(`\nScaffolding project in ${root}...`)

    const pkg = { name: packageName, version: '0.0.0' }
    fs.writeFileSync(path.resolve(root, 'package.json'), JSON.stringify(pkg, null, 2))

    const templateRoot = path.resolve(__dirname, 'template')
    const render = function render(templateName) {
        const templateDir = path.resolve(templateRoot, templateName)
        renderTemplate(templateDir, root)
    }

    // Render base template
    render('base')

    // Render code template.
    // prettier-ignore
    const codeTemplate =
        (needsTypeScript ? 'typescript-' : '') + 'default'
    render(`code/${codeTemplate}`)

    // Instructions:
    // Supported package managers: pnpm > yarn > npm
    const userAgent = process.env.npm_config_user_agent ?? ''
    const packageManager = /pnpm/.test(userAgent) ? 'pnpm' : /yarn/.test(userAgent) ? 'yarn' : 'npm'

    // README generation
    // todo complete
    fs.writeFileSync(
        path.resolve(root, 'README.md'),
        generateReadme({
            projectName: result.projectName ?? result.packageName ?? defaultProjectName,
            packageManager
        })
    )

    console.log(`\nDone. Now run:\n`)
    if (root !== cwd) {
        console.log(`  ${bold(green(`cd ${path.relative(cwd, root)}`))}`)
    }
    console.log(`  ${bold(green(getCommand(packageManager, 'install')))}`)
    console.log(`  ${bold(green(getCommand(packageManager, 'dev')))}`)
    console.log()
}

init().catch((e) => {
    console.error(e)
})
