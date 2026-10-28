"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { LoaderCircle, Minus, Plus, X } from "lucide-react";
import {
  getActivityDetailAction,
  restoreActivityAction,
} from "@/backend/activity/actions";
import { Badge } from "@/frontend/components/ui/badge";
import { Button } from "@/frontend/components/ui/button";
import { ConfirmDialog } from "@/frontend/components/ui/confirm-dialog";
import { Modal } from "@/frontend/components/ui/modal";
import { useStatus } from "@/frontend/components/ui/status-modal";
import {
  ACTIVITY_ACTION_LABEL,
  ACTIVITY_ACTION_TONE,
  ACTIVITY_MODULE_LABEL,
} from "@/lib/activity";
import { formatDateTime } from "@/lib/format";
import { ACTION_STYLE } from "@/frontend/components/ui/action-style";

type Detail = NonNullable<Awaited<ReturnType<typeof getActivityDetailAction>>>;

type Field = Detail["fields"][number];

function FullTable({
  fields,
  pick,
}: {
  fields: Field[];
  pick: "before" | "after";
}) {
  return (
    <div className="activity-diff-wrap">
      <table className="activity-diff">
        <tbody>
          {fields.map((field) => (
            <tr key={field.label}>
              <td>{field.label}</td>
              <td>{field[pick] ?? "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type ActivityDetailDialogProps = {
  id: number;
  canRestore: boolean;
  onClose: () => void;
};

export function ActivityDetailDialog({
  id,
  canRestore,
  onClose,
}: ActivityDetailDialogProps) {
  const router = useRouter();
  const notify = useStatus();
  const [detail, setDetail] = useState<Detail | null | undefined>(undefined);
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    getActivityDetailAction(id).then((result) => {
      if (active) setDetail(result);
    });
    return () => {
      active = false;
    };
  }, [id]);

  const restore = () => {
    startTransition(async () => {
      const result = await restoreActivityAction(id);
      onClose();
      if (result.ok) router.refresh();
      notify(
        result.message ??
          (result.ok ? "Data dikembalikan." : "Gagal mengembalikan data."),
        result.ok ? "success" : "error",
      );
    });
  };

  if (confirming && detail) {
    const isDelete = detail.action === "delete";
    return (
      <ConfirmDialog
        title={
          isDelete
            ? "Kembalikan data yang dihapus?"
            : "Kembalikan ke versi ini?"
        }
        description={
          isDelete
            ? `${detail.targetLabel ?? "Data"} dipasang kembali seperti sebelum dihapus.`
            : `${detail.targetLabel ?? "Data"} dikembalikan seperti saat aktivitas #${detail.id}. Pengembalian ini juga tercatat di riwayat.`
        }
        confirmLabel="Kembalikan"
        summary={[
          ["Data", detail.targetLabel ?? "-"],
          ["Modul", ACTIVITY_MODULE_LABEL[detail.module]],
          ["Dicatat di", "Riwayat aktivitas"],
        ]}
        icon={ACTION_STYLE.restore.icon}
        tone={ACTION_STYLE.restore.modal}
        pending={pending}
        onConfirm={restore}
        onClose={() => setConfirming(false)}
      />
    );
  }

  const isDelete = detail?.action === "delete";
  const restoreMode = canRestore && Boolean(detail?.restorable);
  const headerStyle = restoreMode ? ACTION_STYLE.restore : ACTION_STYLE.view;
  const changes = detail ? detail.fields.filter((field) => field.changed) : [];

  return (
    <Modal
      title={`Aktivitas #${id}`}
      icon={headerStyle.icon}
      tone={headerStyle.modal}
      size="lg"
      onClose={onClose}
    >
      <div className="modal-body">
        {detail === undefined ? (
          <div className="activity-loading">
            <LoaderCircle className="spin" aria-hidden="true" />
            Memuat detail…
          </div>
        ) : detail === null ? (
          <p className="cell-muted">Aktivitas tidak ditemukan.</p>
        ) : (
          <>
            <dl className="info-list activity-meta">
              <div>
                <dt>Waktu</dt>
                <dd>{formatDateTime(detail.createdAt)}</dd>
              </div>
              <div>
                <dt>Pengguna</dt>
                <dd>{detail.actorName ?? "Tidak dikenal"}</dd>
              </div>
              <div>
                <dt>Aksi</dt>
                <dd>
                  <Badge tone={ACTIVITY_ACTION_TONE[detail.action]}>
                    {ACTIVITY_ACTION_LABEL[detail.action]}
                  </Badge>
                </dd>
              </div>
              <div>
                <dt>Modul</dt>
                <dd>{ACTIVITY_MODULE_LABEL[detail.module]}</dd>
              </div>
              <div>
                <dt>Data</dt>
                <dd>{detail.targetLabel ?? "-"}</dd>
              </div>
              <div>
                <dt>Keterangan</dt>
                <dd>{detail.detail ?? "-"}</dd>
              </div>
              <div>
                <dt>Perangkat</dt>
                <dd>{detail.device}</dd>
              </div>
              <div>
                <dt>Alamat IP</dt>
                <dd>{detail.ipAddress ?? "-"}</dd>
              </div>
            </dl>

            {detail.compared ? (
              <>
                <h3 className="activity-section">Perubahan</h3>
                {changes.length ? (
                  <div className="activity-diff-wrap">
                    <table className="activity-diff">
                      <thead>
                        <tr>
                          <th>Kolom</th>
                          <th>Sebelum</th>
                          <th>Sesudah</th>
                        </tr>
                      </thead>
                      <tbody>
                        {changes.map((field) => (
                          <tr key={field.label} data-changed>
                            <td>{field.label}</td>
                            {field.list ? (
                              <td colSpan={2}>
                                <div className="diff-chips">
                                  {field.added.map((item) => (
                                    <span
                                      key={`+${item}`}
                                      className="diff-chip added"
                                    >
                                      <Plus aria-hidden="true" />
                                      {item}
                                    </span>
                                  ))}
                                  {field.removed.map((item) => (
                                    <span
                                      key={`-${item}`}
                                      className="diff-chip removed"
                                    >
                                      <Minus aria-hidden="true" />
                                      {item}
                                    </span>
                                  ))}
                                </div>
                              </td>
                            ) : (
                              <>
                                <td className="before">{field.before}</td>
                                <td className="after">{field.after}</td>
                              </>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="activity-empty">
                    Tidak ada kolom data yang berubah.
                  </p>
                )}
                <details className="activity-full">
                  <summary>Lihat data lengkap setelah perubahan</summary>
                  <FullTable fields={detail.fields} pick="after" />
                </details>
              </>
            ) : (
              detail.fields.length > 0 && (
                <>
                  <h3 className="activity-section">
                    {isDelete ? "Data saat dihapus" : "Data"}
                  </h3>
                  <FullTable
                    fields={detail.fields}
                    pick={isDelete ? "before" : "after"}
                  />
                </>
              )
            )}
          </>
        )}
      </div>
      <div className="modal-foot">
        <Button icon={X} onClick={onClose}>
          Tutup
        </Button>
        {restoreMode && (
          <Button
            variant={ACTION_STYLE.restore.button}
            icon={ACTION_STYLE.restore.icon}
            onClick={() => setConfirming(true)}
          >
            {isDelete ? "Kembalikan data" : "Kembalikan ke versi ini"}
          </Button>
        )}
      </div>
    </Modal>
  );
}
