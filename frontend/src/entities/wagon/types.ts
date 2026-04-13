export type WagonType = "gondola" | "grain_hopper" | "cement_hopper";

export type CargoType = "ore" | "crushed_stone" | "grain" | "cement";

export interface Wagon {
  id: string;
  type: WagonType;
  currentStationId: string;
  isEmpty: boolean;
}

export const CARGO_TO_WAGON: Record<CargoType, WagonType> = {
  ore: "gondola",
  crushed_stone: "gondola",
  grain: "grain_hopper",
  cement: "cement_hopper",
};

export const WAGON_TYPE_LABELS: Record<WagonType, string> = {
  gondola: "Піввагон",
  grain_hopper: "Зерновоз",
  cement_hopper: "Цементовоз",
};

export const CARGO_TYPE_LABELS: Record<CargoType, string> = {
  ore: "Руда",
  crushed_stone: "Щебінь",
  grain: "Зерно",
  cement: "Цемент",
};
