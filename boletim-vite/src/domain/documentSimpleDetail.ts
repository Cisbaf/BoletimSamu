import type { Status } from "./documentDetail";

export interface DocumentSimpleDetail {
  id: number;
  protocol: string;
  status: Status[];
  applicantName: string;
  createdAt: string;
  view?: boolean;
}