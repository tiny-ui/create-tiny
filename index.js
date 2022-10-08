#!/usr/bin/env node

console.log('start')

async function init() {
    console.log('init')
}

init().catch((e) => {
    console.error(e)
})
