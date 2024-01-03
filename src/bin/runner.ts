import debugFactory from 'debug'
import getPackagePaths from '../lib/getPackagePaths.js'
import multiSemanticRelease from '../lib/multiSemanticRelease.js'
import { Flags } from '../typings/index.js'

export default (flags: Flags) => {
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
        // eslint-disable-next-line n/no-process-exit
        process.exit(0)
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error: any) => {
        // Log out errors.
        console.error(`[multi-semantic-release]:`, error)
        // eslint-disable-next-line n/no-process-exit
        process.exit(1)
      },
    )
  } catch (error) {
    // Log out errors.
    console.error(`[multi-semantic-release]:`, error)
    // eslint-disable-next-line n/no-process-exit
    process.exit(1)
  }
}
