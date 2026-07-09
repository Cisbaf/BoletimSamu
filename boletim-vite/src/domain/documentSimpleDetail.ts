import type { Rectification, Status } from "./documentDetail";

export interface DocumentSimpleDetail {
  id: number;
  protocol: string;
  status: Status[];
  rectifications: Rectification[];
  applicantName: string;
  createdAt: string;
  view?: boolean;
}