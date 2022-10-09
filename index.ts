#!/usr/bin/env node
import * as fs from 'node:fs'
import prompts from 'prompts'
import { red, green, bold } from 'kolorist'

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
    if (files.length === 1 && files[0] === '.git') {
        return true
    }

    return false
}

async function init() {
    console.log('Tiny.js')

    let targetDir;
    const defaultProjectName = 'tiny-project'

    let result: {
        projectName?: string
        shouldOverwrite?: string
        needsTypeScript?: string
        needsJsx?: string
    } = {}

    try {
        await prompts([
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
}

init().catch((e) => {
    console.error(e)
})
