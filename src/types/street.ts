export interface StreetData {
  main_id: string;
  st_name: string;
  dist_name: string;
  start_time: string;
  end_time: string;
  side: string;
  from: string;
  to: string;
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
  week_1: string;
  week_2: string;
  week_3: string;
  week_4: string;
  week_5: string;
  year_round?: string;
}

export interface StreetDetails {
  name: string;
  status: 'danger' | 'safe' | 'info';
  message: string;
  nextSweeping: string;
  from: string;
  to: string;
  specificDays: string;
  raw: StreetData;
}
