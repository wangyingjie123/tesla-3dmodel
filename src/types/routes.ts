import type { RouteRecordRaw } from 'vue-router';
export type RouteItem = RouteRecordRaw & {
  title?: string;
  hidden?: boolean;
  children?: RouteItem[];
};
