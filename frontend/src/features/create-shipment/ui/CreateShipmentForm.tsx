import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { createShipmentSchema, type CreateShipmentValues } from "../types";
import { createShipmentApi } from "../api/create-shipment";
import { CARGO_TYPE_LABELS, CargoType } from "@/entities/wagon/types";
import { STATIONS } from "@/shared/config/stations";

export function CreateShipmentForm() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateShipmentValues>({
    resolver: zodResolver(createShipmentSchema),
    defaultValues: {
      wagonCount: 1,
    },
  });

  const mutation = useMutation({
    mutationFn: createShipmentApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      toast.success("Заявку створено успішно");
      navigate("/");
    },
    onError: () => {
      toast.error("Помилка при створенні заявки");
    },
  });

  return (
    <form
      onSubmit={handleSubmit((v) => mutation.mutate(v))}
      className="max-w-xl space-y-5"
    >
      {/* Cargo type */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          Тип вантажу
        </label>
        <select
          {...register("cargoType")}
          className="w-full rounded-md border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Оберіть...</option>
          {(Object.entries(CARGO_TYPE_LABELS) as [CargoType, string][]).map(
            ([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ),
          )}
        </select>
        {errors.cargoType && (
          <p className="text-xs text-destructive">{errors.cargoType.message}</p>
        )}
      </div>

      {/* Wagon count */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          Кількість вагонів
        </label>
        <input
          type="number"
          {...register("wagonCount", { valueAsNumber: true })}
          className="w-full rounded-md border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          min={1}
          max={100}
        />
        {errors.wagonCount && (
          <p className="text-xs text-destructive">
            {errors.wagonCount.message}
          </p>
        )}
      </div>

      {/* Origin */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          Станція відправлення
        </label>
        <select
          {...register("originStationId")}
          className="w-full rounded-md border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Оберіть...</option>
          {STATIONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {errors.originStationId && (
          <p className="text-xs text-destructive">
            {errors.originStationId.message}
          </p>
        )}
      </div>

      {/* Destination */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          Станція призначення
        </label>
        <select
          {...register("destinationStationId")}
          className="w-full rounded-md border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Оберіть...</option>
          {STATIONS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        {errors.destinationStationId && (
          <p className="text-xs text-destructive">
            {errors.destinationStationId.message}
          </p>
        )}
      </div>

      {/* Deadline */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-foreground">
          Дедлайн доставки
        </label>
        <input
          type="date"
          {...register("deadline")}
          className="w-full rounded-md border bg-card px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        {errors.deadline && (
          <p className="text-xs text-destructive">{errors.deadline.message}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={mutation.isPending}
        className="rounded-md bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
      >
        {mutation.isPending ? "Створення..." : "Створити заявку"}
      </button>
    </form>
  );
}
