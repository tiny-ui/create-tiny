#!/usr/bin/env node
import prompts from 'prompts'
import { red, green, bold } from 'kolorist'

async function init() {
    console.log('Tiny.js')

    const cwd = process.cwd()
    try {
        await prompts([
            {
                name: 'projectName',
                type: 'text',
                message: 'Project name:',
                initial: 'defaultProjectName'
            }
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
