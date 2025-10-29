import chokidar from 'chokidar'
import { hideBin } from 'yargs/helpers'
import yargs from 'yargs'
import fs from 'fs'
import path from 'path'

const argv = yargs(hideBin(process.argv))
  .scriptName('watch-rename')
  .usage('$0 [dir]', 'Watch a folder and detect file rename events', y =>
    y.positional('dir', { describe: 'Directory to watch', default: '.' })
  )
  .help()
  .parse()

const folder = path.resolve(argv.dir)

const markdownFiles = fs.readdirSync(folder)
  .filter(f => f.endsWith('.md'))
  .map(f => path.join(folder, f))

console.log(markdownFiles)
if (markdownFiles.length === 0) {
  console.log('No markdown files found in the specified directory.')
  process.exit(1)
}

const watcher = chokidar.watch(folder, { ignoreInitial: true })

const markdownContent = fs.readFileSync(markdownFiles[0], 'utf8')
const lines = markdownContent.split(/\r?\n/)

let newFileName = ''
watcher
  .on('add', filePath => {
    newFileName = filePath.split('/').pop()
  })
  .on('unlink', filePath => {
    const oldFileName = filePath.split('/').pop()
    const idx = lines.findIndex(line => line.includes(oldFileName))
    if (idx !== -1 && newFileName) {
      const altText = newFileName.replaceAll('-', ' ').split('.')[0]
      // lines[idx] = `![${altText}](./images/${newFileName})`
      lines[idx] = `<img src="./images/${newFileName}" alt="${altText}" width="500" />`
      fs.writeFileSync(markdownFiles[0], lines.join('\n'), 'utf8')
      console.log(`UPDATED MARKDOWN: Replaced ${oldFileName} with ${newFileName}`)
    }
    newFileName = ''
  })
