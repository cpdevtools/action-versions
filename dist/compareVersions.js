"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareVersions = void 0;
const semver_1 = __importDefault(require("semver"));
const prereleaseComapreValues_1 = require("./prereleaseComapreValues");
function compareVersions(a, b) {
    a ??= new semver_1.default.SemVer('0.0.0');
    b ??= new semver_1.default.SemVer('0.0.0');
    const aB = semver_1.default.parse(a.version.split('-')[0]);
    const bB = semver_1.default.parse(b.version.split('-')[0]);
    let comp = semver_1.default.compare(aB, bB);
    if (comp === 0 && a?.prerelease?.length && b?.prerelease?.length) {
        const aV = prereleaseComapreValues_1.prereleaseComapreValues[a.prerelease[0]] ?? prereleaseComapreValues_1.prereleaseComapreValues.dev;
        const bV = prereleaseComapreValues_1.prereleaseComapreValues[b.prerelease[0]] ?? prereleaseComapreValues_1.prereleaseComapreValues.dev;
        return aV === bV ? semver_1.default.compare(a, b) : (aV > bV ? 1 : -1);
    }
    else if (comp === 0) {
        return semver_1.default.compare(a, b);
    }
    return comp;
}
exports.compareVersions = compareVersions;
