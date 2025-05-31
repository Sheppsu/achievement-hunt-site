export type EventIterationType = {
  id: number;
  name: string;
  start: string;
  end: string;
  registration_end: string;
  description: { [_: string]: string };
  banner: string | null;
};
