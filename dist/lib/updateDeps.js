"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateManifestDeps = exports.resolveReleaseType = exports.getNextPreVersion = exports.resolveNextVersion = exports.getPreReleaseTag = exports.getVersionFromTag = exports.getNextVersion = void 0;
const fs_1 = require("fs");
const semver_1 = __importDefault(require("semver"));
const debug_1 = __importDefault(require("debug"));
const recognizeFormat_1 = __importDefault(require("./recognizeFormat"));
const getManifest_1 = __importDefault(require("./getManifest"));
const utils_1 = require("./utils");
const git_1 = require("./git");
const debug = debug_1.default('msr:updateDeps');
const getManifestDifference = (newManifest = {}, oldManifest = {}) => {
    return Object.entries(newManifest).reduce((acc, [key, value]) => {
        if (value !== oldManifest[key]) {
            acc[key] = `${oldManifest[key]} → ${value}`;
        }
        return acc;
    }, {});
};
/**
 * Resolve next package version.
 *
 * @param pkg Package object.
 * @returns Next pkg version.
 * @internal
 */
const getNextVersion = (pkg) => {
    var _a, _b;
    const lastVersion = (_a = pkg._lastRelease) === null || _a === void 0 ? void 0 : _a.version;
    const defaultNextVersion = lastVersion !== null && lastVersion !== void 0 ? lastVersion : '1.0.0';
    if (!lastVersion || !pkg._nextType || typeof pkg._nextType !== 'string') {
        return defaultNextVersion;
    }
    return (_b = semver_1.default.inc(lastVersion, pkg._nextType)) !== null && _b !== void 0 ? _b : defaultNextVersion;
};
exports.getNextVersion = getNextVersion;
/**
 * Resolve the package version from a tag
 *
 * @param pkg Package object.
 * @param tag The tag containing the version to resolve
 *
 * @returns The version of the package or null if no tag was passed
 * @internal
 */
const getVersionFromTag = (pkg, tag) => {
    if (!pkg.name) {
        return tag !== null && tag !== void 0 ? tag : null;
    }
    if (!tag) {
        return null;
    }
    const strMatch = tag.match(/[0-9].[0-9].[0-9].*/);
    return (strMatch === null || strMatch === void 0 ? void 0 : strMatch[0]) && semver_1.default.valid(strMatch[0]) ? strMatch[0] : null;
};
exports.getVersionFromTag = getVersionFromTag;
/**
 * Parse the prerelease tag from a semver version.
 *
 * @param version Semver version in a string format.
 * @returns preReleaseTag Version prerelease tag or null.
 * @internal
 */
const getPreReleaseTag = (version) => {
    const parsed = semver_1.default.parse(version);
    if (parsed == null) {
        return null;
    }
    return parsed.prerelease[0] ? String(parsed.prerelease[0]) : null;
};
exports.getPreReleaseTag = getPreReleaseTag;
/**
 * Resolve next version of dependency.
 *
 * @param currentVersion Current dep version
 * @param nextVersion Next release type: patch, minor, major
 * @param strategy Resolution strategy: inherit, override, satisfy
 * @returns Next dependency version
 * @internal
 */
const resolveNextVersion = (currentVersion, nextVersion, strategy = 'override') => {
    // Check the next pkg version against its current references.
    // If it matches (`*` matches to any, `1.1.0` matches `1.1.x`, `1.5.0` matches to `^1.0.0` and so on)
    // release will not be triggered, if not `override` strategy will be applied instead.
    if ((strategy === 'satisfy' || strategy === 'inherit') &&
        semver_1.default.satisfies(nextVersion, currentVersion)) {
        return currentVersion;
    }
    // `inherit` will try to follow the current declaration version/range.
    // `~1.0.0` + `minor` turns into `~1.1.0`, `1.x` + `major` gives `2.x`,
    // but `1.x` + `minor` gives `1.x` so there will be no release, etc.
    if (strategy === 'inherit') {
        const sep = '.';
        const nextChunks = nextVersion.split(sep);
        const currentChunks = currentVersion.split(sep);
        // prettier-ignore
        const resolvedChunks = currentChunks.map((chunk, i) => nextChunks[i]
            ? chunk.replace(/\d+/, nextChunks[i])
            : chunk);
        return resolvedChunks.join(sep);
    }
    // "override"
    // By default next package version would be set as is for the all dependants.
    return nextVersion;
};
exports.resolveNextVersion = resolveNextVersion;
/**
 * Resolve next prerelease comparing bumped tags versions with last version.
 *
 * @param latestTag Last released tag from branch or null if non-existent.
 * @param lastVersion Last version released.
 * @param pkgPreRelease Prerelease tag from package to-be-released.
 * @returns Next pkg version.
 * @internal
 */
const _nextPreHighestVersion = (latestTag, lastVersion, pkgPreRelease) => {
    const bumpFromTags = latestTag
        ? semver_1.default.inc(latestTag, 'prerelease', pkgPreRelease)
        : null;
    const bumpFromLast = semver_1.default.inc(lastVersion, 'prerelease', pkgPreRelease);
    return bumpFromTags
        ? utils_1.getHighestVersion(bumpFromLast !== null && bumpFromLast !== void 0 ? bumpFromLast : undefined, bumpFromTags)
        : bumpFromLast;
};
/**
 * Resolve next prerelease special cases: highest version from tags or major/minor/patch.
 *
 * @param tags List of all released tags from package.
 * @param lastVersion Last package version released.
 * @param pkgNextType Next type evaluated for the next package type.
 * @param pkgPreRelease Package prerelease suffix.
 * @returns Next pkg version.
 * @internal
 */
const _nextPreVersionCases = (tags, lastVersion, pkgNextType, pkgPreRelease) => {
    // Case 1: Normal release on last version and is now converted to a prerelease
    if (semver_1.default.prerelease(lastVersion) == null) {
        const semVerRes = semver_1.default.parse(lastVersion);
        if (semVerRes == null) {
            throw new Error('Can not parse the last version');
        }
        const { major, minor, patch } = semVerRes;
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        return `${semver_1.default.inc(`${major}.${minor}.${patch}`, pkgNextType || 'patch')}-${pkgPreRelease}.1`;
    }
    // Case 2: Validates version with tags
    const latestTag = utils_1.getLatestVersion(tags, true);
    return _nextPreHighestVersion(latestTag, lastVersion, pkgPreRelease);
};
/**
 * Resolve next package version on prereleases.
 *
 * @param pkg Package object.
 * @param tags Override list of tags from specific pkg and branch.
 * @returns Next pkg version.
 * @internal
 */
const getNextPreVersion = (pkg, tags) => {
    var _a;
    const tagFilters = [pkg._preRelease];
    const lastVersion = (_a = pkg._lastRelease) === null || _a === void 0 ? void 0 : _a.version;
    // Extract tags:
    // 1. Set filter to extract only package tags
    // 2. Get tags from a branch considering the filters established
    // 3. Resolve the versions from the tags
    // TODO: replace {cwd: '.'} with multiContext.cwd
    if (pkg.name) {
        tagFilters.push(pkg.name);
    }
    if (tags == null || tags.length === 0) {
        // eslint-disable-next-line no-param-reassign
        tags = git_1.getTags(pkg._branch, { cwd: '.' }, tagFilters);
    }
    const lastPreRelTag = exports.getPreReleaseTag(lastVersion);
    const isNewPreRelTag = lastPreRelTag && lastPreRelTag !== pkg._preRelease;
    const versionToSet = (isNewPreRelTag !== null && isNewPreRelTag !== void 0 ? isNewPreRelTag : !lastVersion)
        ? // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            `1.0.0-${pkg._preRelease}.1`
        : utils_1.getLatestVersion(tags.map(tag => exports.getVersionFromTag(pkg, tag)).filter(utils_1.isNotNull), true);
    return versionToSet !== null && versionToSet !== void 0 ? versionToSet : undefined;
};
exports.getNextPreVersion = getNextPreVersion;
/**
 * Get dependent release type by recursive scanning and updating its deps.
 *
 * @param pkg The package with local deps to check.
 * @param bumpStrategy Dependency resolution strategy: override, satisfy, inherit.
 * @param releaseStrategy Release type triggered by deps updating: patch, minor, major, inherit.
 * @param ignore Packages to ignore (to prevent infinite loops).
 * @returns Returns the highest release type if found, undefined otherwise
 * @internal
 */
const getDependentRelease = (pkg, bumpStrategy, releaseStrategy, ignore) => {
    const severityOrder = ['patch', 'minor', 'major'];
    const { localDeps, manifest = {} } = pkg;
    const { dependencies = {}, devDependencies = {}, peerDependencies = {}, optionalDependencies = {}, } = manifest;
    const scopes = [
        dependencies,
        devDependencies,
        peerDependencies,
        optionalDependencies,
    ];
    const bumpDependency = (scope, name, nextVersion) => {
        const currentVersion = scope[name];
        if (!nextVersion || !currentVersion) {
            return false;
        }
        const resolvedVersion = exports.resolveNextVersion(currentVersion, nextVersion, releaseStrategy);
        if (currentVersion !== resolvedVersion) {
            // eslint-disable-next-line no-param-reassign
            scope[name] = resolvedVersion;
            return true;
        }
        return false;
    };
    return localDeps
        .filter((p) => !ignore.includes(p))
        .reduce((releaseType, p) => {
        var _a, _b;
        const name = p.name;
        // Has changed if...
        // 1. Any local dep package itself has changed
        // 2. Any local dep package has local deps that have changed.
        const nextType = resolveReleaseType(p, bumpStrategy, releaseStrategy, [
            ...ignore,
            ...localDeps,
        ]);
        // Set the nextVersion fallback to the last local dependency package last version
        let nextVersion = (_a = p._lastRelease) === null || _a === void 0 ? void 0 : _a.version;
        // Update the nextVersion only if there is a next type to be bumped
        if (nextType) {
            nextVersion = p._preRelease ? exports.getNextPreVersion(p) : exports.getNextVersion(p);
        }
        const lastVersion = (_b = pkg._lastRelease) === null || _b === void 0 ? void 0 : _b.version;
        // 3. And this change should correspond to manifest updating rule.
        const requireRelease = scopes.reduce((res, scope) => bumpDependency(scope, name, nextVersion) || res, !lastVersion);
        return requireRelease &&
            severityOrder.indexOf(nextType) >
                severityOrder.indexOf(releaseType)
            ? nextType
            : releaseType;
    }, undefined);
};
/**
 * Resolve package release type taking into account the cascading dependency update.
 *
 * @param pkg Package object.
 * @param bumpStrategy Dependency resolution strategy: override, satisfy, inherit.
 * @param releaseStrategy Release type triggered by deps updating: patch, minor, major, inherit.
 * @param ignore=[] Packages to ignore (to prevent infinite loops).
 * @returns Resolved release type.
 * @internal
 */
function resolveReleaseType(pkg, bumpStrategy = 'override', releaseStrategy = 'patch', ignore = []) {
    // NOTE This fn also updates pkg deps, so it must be invoked anyway.
    const dependentReleaseType = getDependentRelease(pkg, bumpStrategy, releaseStrategy, ignore);
    // Release type found by commitAnalyzer.
    if (pkg._nextType) {
        return pkg._nextType;
    }
    if (!dependentReleaseType) {
        return undefined;
    }
    // Define release type for dependent package if any of its deps changes.
    // `patch`, `minor`, `major` — strictly declare the release type that occurs when any dependency is updated.
    // `inherit` — applies the "highest" release of updated deps to the package.
    // For example, if any dep has a breaking change, `major` release will be applied to the all dependants up the chain.
    // eslint-disable-next-line no-param-reassign
    pkg._nextType =
        releaseStrategy === 'inherit' ? dependentReleaseType : releaseStrategy;
    return pkg._nextType;
}
exports.resolveReleaseType = resolveReleaseType;
/**
 * Clarify what exactly was changed in manifest file.
 * @param actualManifest manifest object
 * @param path manifest path
 * @returns has changed or not
 * @internal
 */
const auditManifestChanges = (actualManifest, path) => {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    const debugPrefix = `[${actualManifest.name}]`;
    const oldManifest = getManifest_1.default(path);
    const depScopes = [
        'dependencies',
        'devDependencies',
        'peerDependencies',
        'optionalDependencies',
    ];
    const changes = depScopes.reduce((res, scope) => {
        var _a;
        const diff = getManifestDifference(actualManifest[scope], (_a = oldManifest[scope]) !== null && _a !== void 0 ? _a : {});
        if (Object.keys(diff).length > 0) {
            res[scope] = diff;
        }
        return res;
    }, {});
    debug(debugPrefix, 'package.json path=', path);
    if (Object.keys(changes).length > 0) {
        debug(debugPrefix, 'changes=', changes);
        return true;
    }
    debug(debugPrefix, 'no deps changes');
    return false;
};
/**
 * Update pkg deps.
 *
 * @param pkg The package this function is being called on.
 * @returns
 * @internal
 */
const updateManifestDeps = (pkg) => {
    const { manifest, path } = pkg;
    const { indent, trailingWhitespace } = recognizeFormat_1.default(manifest.__contents__);
    // Loop through localDeps to verify release consistency.
    pkg.localDeps.forEach(d => {
        var _a;
        // Get version of dependency.
        const release = (_a = d._nextRelease) !== null && _a !== void 0 ? _a : d._lastRelease;
        // Cannot establish version.
        if (!release || !release.version) {
            throw Error(`Cannot release because dependency ${d.name} has not been released`);
        }
    });
    if (!auditManifestChanges(manifest, path)) {
        return;
    }
    // Write package.json back out.
    fs_1.writeFileSync(path, JSON.stringify(manifest, null, indent) + trailingWhitespace);
};
exports.updateManifestDeps = updateManifestDeps;
