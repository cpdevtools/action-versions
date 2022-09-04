import semver from 'semver';
import { prereleaseComapreValues } from './prereleaseComapreValues';

export function compareVersions(a: semver.SemVer, b: semver.SemVer): number {
    const aB = new semver.SemVer(a.version.split('-')[0]);
    const bB = new semver.SemVer(b.version.split('-')[0]);
    let comp = semver.compare(aB, bB);
    if (comp === 0 && a.prerelease?.length && b.prerelease?.length) {
        const aV = prereleaseComapreValues[a.prerelease[0] as keyof typeof prereleaseComapreValues] ?? prereleaseComapreValues.dev;
        const bV = prereleaseComapreValues[b.prerelease[0] as keyof typeof prereleaseComapreValues] ?? prereleaseComapreValues.dev;
        return aV === bV ? 0 : (aV > bV ? 1 : -1);
    } else if (comp === 0) {
        return semver.compare(a, b);
    }
    return comp;
}
