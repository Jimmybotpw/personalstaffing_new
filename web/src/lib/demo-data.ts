export type EmployeeRecord = {
  id: string;
  name: string;
  targetHoursWeek: number;
  maxHoursWeek: number;
  weekendService: boolean;
  openCloseService: boolean;
};

export type AreaRecord = {
  id: string;
  name: string;
  minStaffDefault: number;
  maxStaffDefault: number | null;
};

export const demoEmployees: EmployeeRecord[] = [
  {
    id: "emp-1",
    name: "Alex Meyer",
    targetHoursWeek: 32,
    maxHoursWeek: 40,
    weekendService: true,
    openCloseService: true,
  },
  {
    id: "emp-2",
    name: "Samira Koch",
    targetHoursWeek: 20,
    maxHoursWeek: 24,
    weekendService: false,
    openCloseService: false,
  },
  {
    id: "emp-3",
    name: "Jonas Wolf",
    targetHoursWeek: 16,
    maxHoursWeek: 20,
    weekendService: true,
    openCloseService: false,
  },
];

export const demoAreas: AreaRecord[] = [
  {
    id: "area-1",
    name: "Welcome Desk",
    minStaffDefault: 1,
    maxStaffDefault: 1,
  },
  {
    id: "area-2",
    name: "Training Floor",
    minStaffDefault: 1,
    maxStaffDefault: 2,
  },
  {
    id: "area-3",
    name: "Course Support",
    minStaffDefault: 1,
    maxStaffDefault: 1,
  },
];
