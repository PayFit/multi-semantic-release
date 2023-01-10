import debugFactory from 'debug'
import getPackagePaths from '../lib/getPackagePaths.js'
import multiSemanticRelease from '../lib/multiSemanticRelease.js'

export default (flags: Record<string, any>) => {
  if (flags.debug) {
    debugFactory.enable('msr:*')
  }

  // Get directory.
  const cwd = process.cwd()

  // Catch errors.
  try {
    console.log(`flags: ${JSON.stringify(flags, null, 2)}`)

    // Get list of package.json paths according to workspaces.
    const paths = getPackagePaths(cwd, flags.ignorePackages)
    console.log('package paths', paths)

    // Do multirelease (log out any errors).
    multiSemanticRelease(paths, {}, { cwd }, flags).then(
      () => {
        // Success.
        process.exit(0)
      },
      (error: any) => {
        // Log out errors.
        console.error(`[multi-semantic-release]:`, error)
        process.exit(1)
      },
    )
  } catch (error) {
    // Log out errors.
    console.error(`[multi-semantic-release]:`, error)
    process.exit(1)
  }
}
