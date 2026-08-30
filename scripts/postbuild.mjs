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

// Match the script src whether or not it already has a ?v= query string,
// so this can't silently no-op again if a manual edit ever strips the version.
const scriptSrcPattern = /\/assets\/aira-app\.js(\?v=\d+)?/
if (!scriptSrcPattern.test(html)) {
  console.error('postbuild: could not find "/assets/aira-app.js" script src in index.html — version was NOT bumped, cache-busting is broken!')
  process.exit(1)
}
const updated = html.replace(scriptSrcPattern, `/assets/aira-app.js?v=${version}`)
if (updated === html) {
  console.error('postbuild: index.html unchanged after replace — version was NOT bumped, cache-busting is broken!')
  process.exit(1)
}
writeFileSync(indexPath, updated)

console.log(`postbuild: copied ${entryFile} -> assets/aira-app.js, version=${version}`)
