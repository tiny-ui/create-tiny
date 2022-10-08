#!/usr/bin/env node

console.log('before')

async function init() {
    console.log('init')
}

init().catch((e) => {
    console.error(e)
})
