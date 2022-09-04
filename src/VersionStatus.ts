import { VersionEvaluation } from "./VersionEvaluation";

export interface VersionStatus extends VersionEvaluation {
    pullRequest?: number;
}
