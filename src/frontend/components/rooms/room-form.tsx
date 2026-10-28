"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type SyntheticEvent } from "react";
import { createRoomAction, updateRoomAction } from "@/backend/rooms/actions";
import type { RoomDetail } from "@/backend/rooms/queries";
import { Button } from "@/frontend/components/ui/button";
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
} from "@/frontend/components/ui/card";
import { FIELD_ALERT, FormAlert } from "@/frontend/components/ui/form-alert";
import { ConfirmDialog } from "@/frontend/components/ui/confirm-dialog";
import { Field, Input } from "@/frontend/components/ui/field";
import { MultiSelect } from "@/frontend/components/ui/multi-select";
import {
  SearchSelect,
  type SelectOption,
} from "@/frontend/components/ui/search-select";
import { useStatus } from "@/frontend/components/ui/status-modal";
import {
  ROOM_FACILITIES,
  ROOM_STATUSES,
  ROOM_STATUS_LABEL,
  type RoomFacility,
  type RoomStatus,
} from "@/lib/rooms";
import type { RoomField, RoomInput } from "@/lib/schemas/room";
import { ACTION_STYLE } from "@/frontend/components/ui/action-style";

const LIST_PATH = "/master/ruangan";

const STATUS_OPTIONS = ROOM_STATUSES.map((status) => ({
  value: status,
  label: ROOM_STATUS_LABEL[status],
}));

const FACILITY_OPTIONS = ROOM_FACILITIES.map((facility) => ({
  value: facility.key,
  label: facility.label,
}));

export function RoomForm({
  room,
  departments,
}: {
  room: RoomDetail | null;
  departments: SelectOption[];
}) {
  const router = useRouter();
  const notify = useStatus();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Partial<Record<RoomField, string>>>({});
  const [message, setMessage] = useState<string>();
  const [confirmInput, setConfirmInput] = useState<RoomInput | null>(null);

  const onSubmit = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setConfirmInput({
      name: String(data.get("name") ?? ""),
      location: String(data.get("location") ?? ""),
      departmentId: String(data.get("departmentId") ?? ""),
      capacity: String(data.get("capacity") ?? ""),
      status: String(data.get("status") ?? "") as RoomStatus,
      facilities: data.getAll("facilities").map(String) as RoomFacility[],
    });
  };

  const save = () => {
    if (!confirmInput) return;
    setMessage(undefined);
    setErrors({});
    startTransition(async () => {
      const result = room
        ? await updateRoomAction(room.id, confirmInput)
        : await createRoomAction(confirmInput);
      setConfirmInput(null);
      if (result.ok) {
        notify(result.message ?? "Tersimpan.", "success");
        router.push(LIST_PATH);
        return;
      }
      setErrors(result.fieldErrors ?? {});
      setMessage(result.message);
    });
  };

  const alertText =
    message ?? (Object.keys(errors).length ? FIELD_ALERT : undefined);

  return (
    <>
      <FormAlert message={alertText} />
      <Card>
        <form onSubmit={onSubmit} noValidate>
          <CardHeader
            title="Data ruangan"
            description={
              room
                ? "Booking yang sudah ada tidak berubah."
                : "Ruang baru langsung bisa dipesan bila berstatus Aktif."
            }
          />
          <CardBody>
            <div className="grid2">
              <Field
                label="Nama ruang"
                htmlFor="room-name"
                required
                error={errors.name}
                hint="Contoh: P2-KURMA."
              >
                <Input
                  id="room-name"
                  name="name"
                  defaultValue={room?.name}
                  placeholder="Masukkan nama ruang"
                  maxLength={80}
                />
              </Field>
              <Field
                label="Lokasi"
                htmlFor="room-location"
                required
                error={errors.location}
                hint="Contoh: Gedung P2, lantai 2."
              >
                <Input
                  id="room-location"
                  name="location"
                  defaultValue={room?.location}
                  placeholder="Masukkan lokasi"
                  maxLength={120}
                />
              </Field>
              <Field
                label="Departemen"
                htmlFor="room-department"
                required
                error={errors.departmentId}
                hint="Departemen tempat ruang ini berada."
              >
                <SearchSelect
                  id="room-department"
                  name="departmentId"
                  options={departments}
                  defaultValue={
                    room?.departmentId ? String(room.departmentId) : ""
                  }
                  placeholder="Pilih departemen"
                />
              </Field>
              <Field
                label="Kapasitas"
                htmlFor="room-capacity"
                required
                error={errors.capacity}
              >
                <Input
                  id="room-capacity"
                  name="capacity"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={500}
                  defaultValue={room?.capacity}
                  placeholder="Masukkan kapasitas"
                />
              </Field>
              <Field
                label="Status"
                htmlFor="room-status"
                required
                error={errors.status}
              >
                <SearchSelect
                  id="room-status"
                  name="status"
                  options={STATUS_OPTIONS}
                  defaultValue={room?.status ?? "active"}
                />
              </Field>
              <Field
                label="Fasilitas"
                htmlFor="room-facilities"
                error={errors.facilities}
                hint="Pilih perlengkapan yang tersedia di ruang ini."
              >
                <MultiSelect
                  id="room-facilities"
                  name="facilities"
                  options={FACILITY_OPTIONS}
                  defaultValues={room?.facilities ?? []}
                  placeholder="Pilih fasilitas"
                />
              </Field>
            </div>
          </CardBody>
          <CardFooter>
            <Button
              type="submit"
              variant="primary"
              icon={ACTION_STYLE.save.icon}
              loading={pending}
            >
              {room ? "Simpan perubahan" : "Simpan"}
            </Button>
          </CardFooter>
        </form>
        {confirmInput && (
          <ConfirmDialog
            title={room ? "Simpan perubahan ruangan?" : "Simpan ruangan baru?"}
            description={`${String(confirmInput.name).trim() || "Ruang tanpa nama"}, ${String(confirmInput.capacity) || "0"} orang, status ${ROOM_STATUS_LABEL[confirmInput.status as RoomStatus] ?? "-"}.`}
            confirmLabel={room ? "Simpan perubahan" : "Simpan"}
            icon={ACTION_STYLE.save.icon}
            pending={pending}
            onConfirm={save}
            onClose={() => setConfirmInput(null)}
          />
        )}
      </Card>
    </>
  );
}
