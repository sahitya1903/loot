// Patches @expo/metro-file-map after `npm install` so Metro works on Windows, where
// Node's Dirent can report ordinary files as symlinks and readlink then fails with EINVAL.
// Each patch is an exact text replacement; when an Expo update changes the source,
// the script warns instead of silently doing nothing.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const pkgDir = path.join(root, 'node_modules/@expo/metro-file-map/build')

function patchFile(relPath, transforms) {
  const filePath = path.join(pkgDir, relPath)
  if (!fs.existsSync(filePath)) return
  let content = fs.readFileSync(filePath, 'utf8')
  let changed = false

  for (const { search, replace } of transforms) {
    if (content.includes(replace)) continue // already patched
    if (!content.includes(search)) {
      console.warn(
        `[patch-metro] Could not patch ${relPath}: source changed in this @expo/metro-file-map version. ` +
          'Check whether Metro still needs the Windows fix.',
      )
      continue
    }
    content = content.replace(search, replace)
    changed = true
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8')
    console.log(`[patch-metro] Patched ${relPath}`)
  }
}

// 1. Node crawler: confirm a reported symlink with lstat before treating it as one.
patchFile('crawlers/node/index.js', [
  {
    search: 'const isSymbolicLink = entry.isSymbolicLink();',
    replace: `let isSymbolicLink = entry.isSymbolicLink();\n                    if (isSymbolicLink && process.platform === 'win32') {\n                        try {\n                            isSymbolicLink = _fs().lstatSync(file).isSymbolicLink();\n                        } catch {\n                            isSymbolicLink = false;\n                        }\n                    }`,
  },
  {
    search:
      'isSymbolicLink ? 1 : 0,\n                                    null\n                                ]);\n                            }\n                            if (activeCalls === 0) {',
    replace:
      'stat.isSymbolicLink() ? 1 : 0,\n                                    null\n                                ]);\n                            }\n                            if (activeCalls === 0) {',
  },
])

// 2. Fallback crawler: same lstat check, and treat non-directories as files on Windows.
patchFile('crawlers/node/fallback.js', [
  {
    search: '} else if (entry.isSymbolicLink()) {',
    replace: `} else if (entry.isSymbolicLink() && (process.platform !== 'win32' || (() => { try { return _fs().default.lstatSync(childAbsolutePath).isSymbolicLink(); } catch { return false; } })())) {`,
  },
  {
    search:
      '} else if (entry.isFile()) {\n                const ext = _path().default.extname(name).slice(1);',
    replace: `} else if (entry.isFile() || (process.platform === 'win32' && !entry.isDirectory())) {\n                const ext = _path().default.extname(name).slice(1);`,
  },
])

// 3. File map: a readlink EINVAL means "not a symlink", not a crash.
patchFile('index.js', [
  {
    search: `            return _fs().promises.readlink(this.#pathUtils.normalToAbsolute(normalPath)).then((symlinkTarget)=>{\n                fileMetadata[_constants.default.VISITED] = 1;\n                fileMetadata[_constants.default.SYMLINK] = (0, _normalizePathSeparatorsToPosix.default)(this.#pathUtils.resolveSymlinkToNormal(normalPath, symlinkTarget));\n            });`,
    replace: `            return _fs().promises.readlink(this.#pathUtils.normalToAbsolute(normalPath)).then((symlinkTarget)=>{\n                fileMetadata[_constants.default.VISITED] = 1;\n                fileMetadata[_constants.default.SYMLINK] = (0, _normalizePathSeparatorsToPosix.default)(this.#pathUtils.resolveSymlinkToNormal(normalPath, symlinkTarget));\n            }).catch((err) => {\n                if (err.code === 'EINVAL') {\n                    fileMetadata[_constants.default.SYMLINK] = 0;\n                    return;\n                }\n                throw err;\n            });`,
  },
])
