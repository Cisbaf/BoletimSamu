import type { Rectification, Status } from "./documentDetail";
import type { Correction } from "./documentCorrection";

export interface DocumentSimpleDetail {
  id: number;
  protocol: string;
  status: Status[];
  rectifications: Rectification[];
  corrections: Correction[];
  applicantName: string;
  createdAt: string;
  view?: boolean;
}