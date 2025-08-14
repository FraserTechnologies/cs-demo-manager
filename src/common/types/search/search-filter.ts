import type { DemoSource } from 'csdm/common/types/counter-strike';

export type SearchFilter = {
  steamIds: string[];
  victimSteamIds: string[];
  mapNames: string[];
  startDate: string | undefined;
  endDate: string | undefined;
  demoSources: DemoSource[];
  roundTagIds: string[];
  matchTagIds: string[];
};
