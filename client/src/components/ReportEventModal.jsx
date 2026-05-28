import { useEffect, useState } from "react";
import ModalOverlay from "./ModalOverlay";

export default function ReportEventModal({ open, eventTitle, onClose, onSubmit }) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setReason("");
  }, [open]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(reason.trim());
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalOverlay open={open} onClose={onClose}>
      <div className="mx-auto w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold text-slate-900">Пожаловаться на мероприятие</h3>
        {eventTitle && <p className="mt-1 text-sm text-slate-600">{eventTitle}</p>}
        <p className="mt-2 text-sm text-slate-500">
          Опишите, что не так. Жалобу увидят модераторы.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <textarea
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            rows={4}
            maxLength={1000}
            placeholder="Причина жалобы (необязательно)"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button type="button" className="rounded-lg bg-slate-100 px-4 py-2 text-sm" onClick={onClose}>
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {submitting ? "Отправка…" : "Отправить жалобу"}
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}
