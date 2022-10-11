import getCommand from './getCommand'

export default function generateReadme({
  projectName,
  packageManager
}) {
  let readme = `# ${projectName}

## Requirements

- Node.js >= 0.10
- The adb command line tool

You need adb, accessible from your PATH. If you don't have it yet:
\`\`\`sh
brew cask install android-platform-tools
\`\`\`

## Project Setup
`
  let npmScriptsDescriptions = `\`\`\`sh
${getCommand(packageManager, 'install')}
\`\`\`

### Compile and Hot-Reload for Development

\`\`\`sh
${getCommand(packageManager, 'dev')}
\`\`\`

\`\`\`sh
${getCommand(packageManager, 'build')}
\`\`\`
`

  readme += npmScriptsDescriptions

  return readme
}
