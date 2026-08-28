import { readdirSync, copyFileSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const distAssetsDir = join('dist', 'assets')
const entryFile = readdirSync(distAssetsDir).find((f) => f.endsWith('.js'))

if (!entryFile) {
  console.error('postbuild: could not find built entry JS file in dist/assets')
  process.exit(1)
}

copyFileSync(join(distAssetsDir, entryFile), join('assets', 'aira-app.js'))

const version = Math.floor(Date.now() / 1000)
const indexPath = 'index.html'
const html = readFileSync(indexPath, 'utf8')
const updated = html.replace(
  /\/assets\/aira-app\.js\?v=\d+/,
  `/assets/aira-app.js?v=${version}`
)
writeFileSync(indexPath, updated)

console.log(`postbuild: copied ${entryFile} -> assets/aira-app.js, version=${version}`)
