import { useEffect, useState } from "react";
import ModalOverlay from "./ModalOverlay";

export default function AttendApplyModal({ open, eventTitle, onClose, onSubmit }) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setMessage("");
  }, [open]);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(message.trim());
      setMessage("");
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ModalOverlay open={open} onClose={onClose}>
      <div className="mx-auto w-full max-w-md rounded-xl bg-white p-5 shadow-xl">
        <h3 className="text-lg font-semibold">Заявка на участие</h3>
        {eventTitle && <p className="mt-1 text-sm text-slate-600">{eventTitle}</p>}
        <p className="mt-2 text-sm text-slate-500">
          Организатор рассмотрит заявку. Можно коротко написать, почему хотите прийти.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <textarea
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            rows={4}
            maxLength={500}
            placeholder="Сообщение организатору (необязательно)"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary px-5 py-2.5 text-sm" onClick={onClose}>
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn-primary px-5 py-2.5 text-sm disabled:opacity-50"
            >
              {submitting ? "Отправка…" : "Отправить заявку"}
            </button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}
