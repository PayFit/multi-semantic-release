import { existsSync, lstatSync, readFileSync } from 'fs'
import { JSONSchemaForNPMPackageJsonFiles } from '@schemastore/package'

/**
 * Read the content of target package.json if exists.
 *
 * @param path file path
 * @returns file content
 *
 * @internal
 */
function readManifest(path: string): string {
  // Check it exists.
  // eslint-disable-next-line security/detect-non-literal-fs-filename
  if (!existsSync(path)) {
    throw new ReferenceError(`package.json file not found: "${path}"`)
  }

  // Stat the file.
  let stat
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    stat = lstatSync(path)
  } catch (_) {
    // istanbul ignore next (hard to test — happens if no read access etc).
    throw new ReferenceError(`package.json cannot be read: "${path}"`)
  }

  // Check it's a file!
  if (!stat.isFile()) {
    throw new ReferenceError(`package.json is not a file: "${path}"`)
  }

  // Read the file.
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    return readFileSync(path, 'utf8')
  } catch (_) {
    // istanbul ignore next (hard to test — happens if no read access etc).
    throw new ReferenceError(`package.json cannot be read: "${path}"`)
  }
}

/**
 * Get the parsed contents of a package.json manifest file.
 *
 * @param path The path to the package.json manifest file.
 * @returns The manifest file's contents.
 *
 * @internal
 */
export default function getManifest(
  path: string,
): JSONSchemaForNPMPackageJsonFiles {
  // Read the file.
  const contents = readManifest(path)

  // Parse the file.
  let manifest: JSONSchemaForNPMPackageJsonFiles
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    manifest = JSON.parse(contents)
  } catch (_) {
    throw new SyntaxError(`package.json could not be parsed: "${path}"`)
  }

  // Must be an object.
  if (typeof manifest !== 'object') {
    throw new SyntaxError(`package.json was not an object: "${path}"`)
  }

  // Must have a name.
  if (typeof manifest.name !== 'string' || !manifest.name.length) {
    throw new SyntaxError(`Package name must be non-empty string: "${path}"`)
  }

  // Check dependencies.
  const checkDeps = (scope: string) => {
    if (scope in manifest && typeof manifest[scope] !== 'object') {
      throw new SyntaxError(`Package ${scope} must be object: "${path}"`)
    }
  }

  checkDeps('dependencies')
  checkDeps('devDependencies')
  checkDeps('peerDependencies')
  checkDeps('optionalDependencies')

  // NOTE non-enumerable prop is skipped by JSON.stringify
  Object.defineProperty(manifest, '__contents__', {
    enumerable: false,
    value: contents,
  })

  // Return contents.
  return manifest
}
