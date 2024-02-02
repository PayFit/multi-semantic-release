/* eslint-disable @typescript-eslint/no-explicit-any */
import { JSONSchemaForNPMPackageJsonFiles } from '@schemastore/package'
import {
  BranchSpec,
  LastRelease,
  NextRelease,
  Options,
  Result,
  VerifyConditionsContext,
  AnalyzeCommitsContext,
  GenerateNotesContext,
  PrepareContext,
  PublishContext,
  BaseContext,
} from 'semantic-release'
import { ReleaseType } from 'semver'
import { WriteStream } from 'tty'

export interface Plugins {
  verifyConditions: (context: VerifyConditionsContext) => any
  analyzeCommits: (context: AnalyzeCommitsContext) => any
  generateNotes: (context: GenerateNotesContext) => any
  prepare: (context: PrepareContext) => any
  publish: (context: PublishContext) => any
}

export interface Logger {
  error: (message: string, fields?: Record<string, any>) => void
  log: (message: string, fields?: Record<string, any>) => void
}

export interface Package {
  // String path to `package.json` for the package.
  path: string
  // The working directory for the package.
  dir: string
  // The name of the package, e.g. `my-amazing-package`
  name: string
  // Array of all dependency package names for the package (merging dependencies, devDependencies, peerDependencies).
  deps: string[]
  // Array of local dependencies this package relies on.
  localDeps: Package[]
  // The semantic-release context for this package's release (filled in once semantic-release runs).
  context?: BaseContext
  // The result of semantic-release (object with lastRelease, nextRelease, commits, releases), false if this package was skipped (no changes or similar), or undefined if the package's release hasn't completed yet.
  result?: Result
  // The manifest read from the `package.json` of the package
  manifest: JSONSchemaForNPMPackageJsonFiles
  // The semantic release options use to release the package
  options: Options & { _pkgOptions: Options }
  // The semantic release plugins
  plugins: Plugins
  // The semantic release logger
  loggerRef: Logger

  /* Keys used in the inline plugin creator */
  // True if the package has been tagged with its new version
  _tagged?: boolean
  // The next version type that will be applied to the package
  _nextType?: ReleaseType
  // If the package is ready to be release
  _ready?: boolean
  // If the next version is a pre release
  _preRelease?: string | boolean | undefined | null
  // The specification of the branch
  _branch?: BranchSpec
  // Last release of the package
  _lastRelease?: LastRelease
  // If the package commits have been analyzed
  _analyzed?: boolean
  // Next release of the package
  _nextRelease?: NextRelease
  // If the package dependencies have been updated
  _depsUpdated?: boolean
  // If the package is prepared
  _prepared?: boolean
  // If the package has been published
  _published?: boolean
}

export interface BaseMultiContext {
  globalOptions: Options
  inputOptions: Options
  // The semantic release options
  // globalOptions: Options
  // inputOptions: Options
  // The current working directory.
  cwd: string
  // The environment variables.
  env: Record<string, string>
  // The output stream for this multirelease.
  stdout: WriteStream
  // The error stream for this multirelease.
  stderr: WriteStream
  // The logger for the multirelease.
  logger: Logger
}

export interface MultiContext extends BaseMultiContext {
  // Array of all packages in this multirelease.
  packages: Package[]
  // Array of packages that will release.
  releasing: Package[]
}

export type PluginOption = Record<string, any>

// TODO Do it from multi-semrel documentation
export interface Flags extends Record<string, any> {
  debug?: boolean
  firstParent?: boolean
  dryRun?: boolean
  ignorePackages?: string[]
  deps?: {
    bump?: string
    release?: ReleaseType | 'inherit'
  }
  concurrent?: boolean
}
