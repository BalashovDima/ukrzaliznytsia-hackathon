import { z } from "zod";

export const createShipmentSchema = z.object({
  cargoType: z.enum(["ore", "crushed_stone", "grain", "cement"], {
    required_error: "Оберіть тип вантажу",
  }),
  wagonCount: z
    .number({ required_error: "Вкажіть кількість вагонів" })
    .min(1, "Мінімум 1 вагон")
    .max(100, "Максимум 100 вагонів"),
  originStationId: z.string().min(1, "Оберіть станцію відправлення"),
  destinationStationId: z.string().min(1, "Оберіть станцію призначення"),
  deadline: z.string().min(1, "Вкажіть дедлайн"),
});

export type CreateShipmentValues = z.infer<typeof createShipmentSchema>;
