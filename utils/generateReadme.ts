import getCommand from './getCommand'

export default function generateReadme({
  projectName,
  packageManager
}) {
  let readme = `# ${projectName}

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
