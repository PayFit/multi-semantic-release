import { ReleaseType } from 'semver'

import { resolveReleaseType, resolveNextVersion } from '../../lib/updateDeps.js'
import { BaseMultiContext, Package } from '../../typings/index.js'

describe('resolveNextVersion()', () => {
  // prettier-ignore
  const cases = [
		["1.0.0", "1.0.1", undefined, "1.0.1"],
		["1.0.0", "1.0.1", "override", "1.0.1"],

		["*", "1.3.0", "satisfy", "*"],
		["^1.0.0", "1.0.1", "satisfy", "^1.0.0"],
		["^1.2.0", "1.3.0", "satisfy", "^1.2.0"],
		["1.2.x", "1.2.2", "satisfy", "1.2.x"],

		["~1.0.0", "1.1.0", "inherit", "~1.1.0"],
		["1.2.x", "1.2.1", "inherit", "1.2.x"],
		["1.2.x", "1.3.0", "inherit", "1.3.x"],
		["^1.0.0", "2.0.0", "inherit", "^2.0.0"],
		["*", "2.0.0", "inherit", "*"],
		["~1.0", "2.0.0", "inherit", "~2.0"],
		["~2.0", "2.1.0", "inherit", "~2.1"],
	]

  cases.forEach(([currentVersion, nextVersion, strategy, resolvedVersion]) => {
    it(`${String(currentVersion)}/${String(nextVersion)}/${String(
      strategy,
    )} gives ${String(resolvedVersion)}`, () => {
      expect(
        resolveNextVersion(
          currentVersion as string,
          nextVersion as string,
          strategy as ReleaseType,
        ),
      ).toBe(resolvedVersion)
    })
  })
})

describe('resolveReleaseType()', () => {
  // prettier-ignore
  const cases = [
		[
			"returns own package's _nextType if exists",
			{
				_nextType: "patch",
        _nextRelease: { version: "1.0.0" },
				localDeps: [],
			},
			undefined,
			undefined,
			"patch",
		],
		[
			"implements `inherit` strategy: returns the highest release type of any deps",
			{
				manifest: { dependencies: { a: "1.0.0" } },
				_nextType: undefined,
				localDeps: [
					{
						name: "a",
						manifest: { dependencies: { b: "1.0.0", c: "1.0.0", d: "1.0.0" } },
						_lastRelease: { version: "1.0.0" },
						_nextType: false,
						localDeps: [
							{ name: "b", _nextType: false, localDeps: [], _lastRelease: { version: "1.0.0" }  },
							{ name: "c", _nextType: "patch", localDeps: [], _lastRelease: { version: "1.0.0" }, _nextRelease: { version: "1.0.1" },  },
							{ name: "d", _nextType: "major", localDeps: [], _lastRelease: { version: "1.0.0" }, _nextRelease: { version: "2.0.0" },  },
						],
					},
				],
			},
			undefined,
			"inherit",
			"major"
		],
		[
			"overrides dependent release type with custom value if defined",
			{
				manifest: { dependencies: { a: "1.0.0" } },
				_nextType: undefined,
				localDeps: [
					{
						name: "a",
						// _lastRelease: { version: "1.0.0" },
						manifest: { dependencies: { b: "1.0.0", c: "1.0.0", d: "1.0.0" } },
						_nextType: false,
						localDeps: [
							{ name: "b", _nextType: false, localDeps: [], _lastRelease: { version: "1.0.0" }  },
							{ name: "c", _nextType: "minor", localDeps: [], _lastRelease: { version: "1.0.0" }, _nextRelease: { version: "1.1.0" },  },
							{ name: "d", _nextType: "patch", localDeps: [], _lastRelease: { version: "1.0.0" }, _nextRelease: { version: "1.0.1" },  },
						],
					},
				],
			},
			undefined,
			"major",
			"major"
		],
		[
			"uses `patch` strategy as default (legacy flow)",
			{
				manifest: { dependencies: { a: "1.0.0" } },
				_nextType: undefined,
				localDeps: [
					{
						name: "a",
						_nextType: false,
						// _lastRelease: { version: "1.0.0" },
						manifest: { dependencies: { b: "1.0.0", c: "1.0.0", d: "1.0.0" } },
						localDeps: [
							{ name: "b", _nextType: false, localDeps: [], _lastRelease: { version: "1.0.0" }  },
							{ name: "c", _nextType: "minor", localDeps: [], _lastRelease: { version: "1.0.0" }, _nextRelease: { version: "1.1.0" },  },
							{ name: "d", _nextType: "major", localDeps: [], _lastRelease: { version: "1.0.0" }, _nextRelease: { version: "2.0.0" },  },
						],
					},
				],
			},
			undefined,
			undefined,
			"patch"
		],
		[
			"returns undefined if no _nextRelease found",
			{
				_nextType: undefined,
				localDeps: [
					{
						_nextType: false,
						localDeps: [
							{ _nextType: false, localDeps: [] },
							{
								_nextType: undefined,
								localDeps: [
									{ _nextType: undefined, localDeps: [] }
								]
							},
						],
					},
				],
			},
			undefined,
			undefined,
			undefined,
		],
	]

  cases.forEach(([name, pkg, bumpStrategy, releaseStrategy, result]) => {
    it(`${String(name)}`, () => {
      expect(
        resolveReleaseType(
          pkg as any as Package,
          {} as any as BaseMultiContext,
          bumpStrategy as string,
          releaseStrategy as ReleaseType,
        ),
      ).toBe(result)
    })
  })
})
