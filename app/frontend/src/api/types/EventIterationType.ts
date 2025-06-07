export type EventIterationType = {
  id: number;
  name: string;
  start: string;
  end: string;
  registration_end: string;
  registration_open: boolean;
  description: { heading: string; text: string; order: number }[];
  banner: string | null;
};
