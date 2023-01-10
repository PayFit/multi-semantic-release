import { execa } from 'execa'
import * as path from 'path'
import { fileURLToPath } from 'url'
import { jest } from '@jest/globals'

import { copyDirectory } from '../helpers/file.js'
import {
  gitInit,
  gitCommitAll,
  gitInitOrigin,
  gitPush,
} from '../helpers/git.js'

// Tests are a bit long, let's increase the Jest timeout
jest.setTimeout(5 * 60 * 1000)

// Tests.
describe('multi-semantic-release CLI', () => {
  test('Initial commit (changes in all packages)', async () => {
    // Create Git repo with copy of Yarn workspaces fixture.
    const cwd = gitInit()
    copyDirectory(`src/test/fixtures/yarnWorkspaces/`, cwd)
    gitCommitAll(cwd, 'feat: Initial release')
    gitInitOrigin(cwd)
    gitPush(cwd)

    // Path to CLI command.
    const filepath = path.resolve(
      fileURLToPath(new URL(`../../bin/cli.ts`, import.meta.url)),
    )

    // Run via command line.
    const out = (
      await execa('ts-node', ['--esm', '--files', filepath], { cwd })
    ).stdout
    expect(out).toMatch('Started multirelease! Loading 4 packages...')
    expect(out).toMatch('Released 4 of 4 packages, semantically!')
  })

  test('Initial commit (changes in 2 packages, 2 filtered out)', async () => {
    // Create Git repo with copy of Yarn workspaces fixture.
    const cwd = gitInit()
    copyDirectory(`src/test/fixtures/yarnWorkspaces/`, cwd)
    gitCommitAll(cwd, 'feat: Initial release')
    gitInitOrigin(cwd)
    gitPush(cwd)

    // Path to CLI command.
    const filepath = path.resolve(
      fileURLToPath(new URL(`../../bin/cli.ts`, import.meta.url)),
    )

    // Run via command line.
    const out = (
      await execa(
        'ts-node',
        [
          '--esm',
          '--files',
          filepath,
          '--ignore-packages=packages/c/**,packages/d/**',
        ],
        { cwd },
      )
    ).stdout
    expect(out).toMatch('Started multirelease! Loading 2 packages...')
    expect(out).toMatch('Released 2 of 2 packages, semantically!')
  })
})
