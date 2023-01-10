/* eslint-disable n/no-path-concat */
import { resolve } from 'path'
import { fileURLToPath } from 'url'

import getPackagePaths from '../../lib/getPackagePaths.js'

// Tests.
describe('getPackagePaths()', () => {
  test('yarn: Works correctly with workspaces', () => {
    const resolved = resolve(
      fileURLToPath(new URL('../fixtures/yarnWorkspaces', import.meta.url)),
    )
    expect(getPackagePaths(resolved)).toEqual([
      `${resolved}/packages/a/package.json`,
      `${resolved}/packages/b/package.json`,
      `${resolved}/packages/c/package.json`,
      `${resolved}/packages/d/package.json`,
    ])
  })
  test('yarn: Should ignore some packages', () => {
    const resolved = resolve(
      fileURLToPath(
        new URL('../fixtures/yarnWorkspacesIgnore', import.meta.url),
      ),
    )
    expect(getPackagePaths(resolved)).toEqual([
      `${resolved}/packages/a/package.json`,
      `${resolved}/packages/b/package.json`,
      `${resolved}/packages/c/package.json`,
    ])

    const resolvedSplit = resolve(
      fileURLToPath(
        new URL('../fixtures/yarnWorkspacesIgnoreSplit', import.meta.url),
      ),
    )
    expect(getPackagePaths(resolvedSplit)).toEqual([
      `${resolvedSplit}/packages/a/package.json`,
      `${resolvedSplit}/packages/c/package.json`,
    ])
  })
  test('yarn: Should ignore some packages via CLI', () => {
    const resolved = resolve(
      fileURLToPath(
        new URL('../fixtures/yarnWorkspacesIgnore', import.meta.url),
      ),
    )
    expect(
      getPackagePaths(resolved, ['packages/a/**', 'packages/b/**']),
    ).toEqual([`${resolved}/packages/c/package.json`])

    const resolvedSplit = resolve(
      fileURLToPath(
        new URL('../fixtures/yarnWorkspacesIgnoreSplit', import.meta.url),
      ),
    )
    expect(
      getPackagePaths(resolvedSplit, ['packages/b', 'packages/d']),
    ).toEqual([
      `${resolvedSplit}/packages/a/package.json`,
      `${resolvedSplit}/packages/c/package.json`,
    ])
  })
  test('yarn: Should throw when ignored packages from CLI and workspaces sets an empty workspace list to be processed', () => {
    const resolved = resolve(
      fileURLToPath(
        new URL('../fixtures/yarnWorkspacesIgnore', import.meta.url),
      ),
    )
    expect(() =>
      getPackagePaths(resolved, [
        'packages/a/**',
        'packages/b/**',
        'packages/c/**',
      ]),
    ).toThrow(TypeError)
    expect(() =>
      getPackagePaths(resolved, [
        'packages/a/**',
        'packages/b/**',
        'packages/c/**',
      ]),
    ).toThrow(
      'package.json: Project must contain one or more workspace-packages',
    )
  })
  test('yarn: Error if no workspaces setting', () => {
    const resolved = resolve(
      fileURLToPath(
        new URL('../fixtures/emptyYarnWorkspaces', import.meta.url),
      ),
    )
    expect(() => getPackagePaths(resolved)).toThrow(Error)
    expect(() => getPackagePaths(resolved)).toThrow(
      'contain one or more workspace-packages',
    )
  })
  test('yarn: Works correctly with workspaces.packages', () => {
    const resolved = resolve(
      fileURLToPath(
        new URL('../fixtures/yarnWorkspacesPackages', import.meta.url),
      ),
    )
    expect(getPackagePaths(resolved)).toEqual([
      `${resolved}/packages/a/package.json`,
      `${resolved}/packages/b/package.json`,
      `${resolved}/packages/c/package.json`,
      `${resolved}/packages/d/package.json`,
    ])
  })
  test('pnpm: Works correctly with workspace', () => {
    const resolved = resolve(
      fileURLToPath(new URL('../fixtures/pnpmWorkspace', import.meta.url)),
    )
    expect(getPackagePaths(resolved)).toEqual([
      `${resolved}/packages/a/package.json`,
      `${resolved}/packages/b/package.json`,
      `${resolved}/packages/c/package.json`,
      `${resolved}/packages/d/package.json`,
    ])
  })
  test('pnpm: Error if no workspaces setting', () => {
    const resolved = resolve(
      fileURLToPath(
        new URL('../fixtures/pnpmWorkspaceUndefined', import.meta.url),
      ),
    )
    expect(() => getPackagePaths(resolved)).toThrow(Error)
    expect(() => getPackagePaths(resolved)).toThrow(
      'contain one or more workspace-packages',
    )
  })
  test('pnpm: Should ignore some packages', () => {
    const resolved = resolve(
      fileURLToPath(
        new URL('../fixtures/pnpmWorkspaceIgnore', import.meta.url),
      ),
    )
    expect(getPackagePaths(resolved)).toEqual([
      `${resolved}/packages/a/package.json`,
      `${resolved}/packages/b/package.json`,
      `${resolved}/packages/c/package.json`,
    ])
  })
  test('pnpm: Should ignore some packages via CLI', () => {
    const resolved = resolve(
      fileURLToPath(
        new URL('../fixtures/pnpmWorkspaceIgnore', import.meta.url),
      ),
    )
    expect(
      getPackagePaths(resolved, ['packages/a/**', 'packages/b/**']),
    ).toEqual([`${resolved}/packages/c/package.json`])
  })
  test('bolt: Works correctly with workspaces', () => {
    const resolved = resolve(
      fileURLToPath(new URL('../fixtures/boltWorkspaces', import.meta.url)),
    )
    expect(getPackagePaths(resolved)).toEqual([
      `${resolved}/packages/a/package.json`,
      `${resolved}/packages/b/package.json`,
      `${resolved}/packages/c/package.json`,
      `${resolved}/packages/d/package.json`,
    ])
  })
  test('bolt: Error if no workspaces setting', () => {
    const resolved = resolve(
      fileURLToPath(
        new URL('../fixtures/boltWorkspacesUndefined', import.meta.url),
      ),
    )
    expect(() => getPackagePaths(resolved)).toThrow(Error)
    expect(() => getPackagePaths(resolved)).toThrow(
      'contain one or more workspace-packages',
    )
  })
  test('bolt: Should ignore some packages', () => {
    const resolved = resolve(
      fileURLToPath(
        new URL('../fixtures/boltWorkspacesIgnore', import.meta.url),
      ),
    )
    expect(getPackagePaths(resolved)).toEqual([
      `${resolved}/packages/a/package.json`,
      `${resolved}/packages/b/package.json`,
      `${resolved}/packages/c/package.json`,
    ])
  })
  test('bolt: Should ignore some packages via CLI', () => {
    const resolved = resolve(
      fileURLToPath(
        new URL('../fixtures/boltWorkspacesIgnore', import.meta.url),
      ),
    )
    expect(
      getPackagePaths(resolved, ['packages/a/**', 'packages/b/**']),
    ).toEqual([`${resolved}/packages/c/package.json`])
  })
})
