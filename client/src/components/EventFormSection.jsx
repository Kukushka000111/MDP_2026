export default function EventFormSection({
  editingEventId,
  eventForm,
  setEventForm,
  meta,
  geocodeCandidates,
  eventSubmitError,
  eventSubmitMessage,
  onSubmit,
  onReset,
  onGeocode,
  onApplyCandidate,
  onImageFileChange
}) {
  return (
    <section className="mb-4 rounded-lg bg-white p-4 shadow">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold">{editingEventId ? "Редактировать мероприятие" : "Создать мероприятие"}</h2>
        {editingEventId && (
          <button type="button" className="rounded bg-slate-200 px-2 py-1 text-sm" onClick={onReset}>
            Отменить редактирование
          </button>
        )}
      </div>
      <form onSubmit={onSubmit} className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <input className="rounded border px-2 py-1" placeholder="Название" value={eventForm.title} onChange={(event) => setEventForm((prev) => ({ ...prev, title: event.target.value }))} required />
        <input className="rounded border px-2 py-1" placeholder="Адрес" value={eventForm.address} onChange={(event) => setEventForm((prev) => ({ ...prev, address: event.target.value }))} required />
        <input className="rounded border px-2 py-1" placeholder="Организатор" value={eventForm.organizerName} onChange={(event) => setEventForm((prev) => ({ ...prev, organizerName: event.target.value }))} required />
        <input className="rounded border px-2 py-1" placeholder="Контакт" value={eventForm.organizerContact} onChange={(event) => setEventForm((prev) => ({ ...prev, organizerContact: event.target.value }))} />
        <input className="rounded border px-2 py-1" placeholder="URL фото (опционально)" value={eventForm.imageUrl} onChange={(event) => setEventForm((prev) => ({ ...prev, imageUrl: event.target.value }))} />
        <input type="file" accept="image/*" className="rounded border px-2 py-1 text-xs" onChange={onImageFileChange} />
        <select className="rounded border px-2 py-1" value={eventForm.categoryId} onChange={(event) => setEventForm((prev) => ({ ...prev, categoryId: event.target.value }))} required>
          <option value="">Категория</option>
          {meta.categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <select className="rounded border px-2 py-1" value={eventForm.districtId} onChange={(event) => setEventForm((prev) => ({ ...prev, districtId: event.target.value }))} required>
          <option value="">Район</option>
          {meta.districts.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
        </select>
        <input type="datetime-local" className="rounded border px-2 py-1" value={eventForm.startsAt} onChange={(event) => setEventForm((prev) => ({ ...prev, startsAt: event.target.value }))} required />
        <input type="datetime-local" className="rounded border px-2 py-1" value={eventForm.endsAt} onChange={(event) => setEventForm((prev) => ({ ...prev, endsAt: event.target.value }))} required />
        <input className="rounded border px-2 py-1" placeholder="Широта" value={eventForm.latitude} onChange={(event) => setEventForm((prev) => ({ ...prev, latitude: event.target.value }))} />
        <input className="rounded border px-2 py-1" placeholder="Долгота" value={eventForm.longitude} onChange={(event) => setEventForm((prev) => ({ ...prev, longitude: event.target.value }))} />
        <select className="rounded border px-2 py-1" value={eventForm.eventType} onChange={(event) => setEventForm((prev) => ({ ...prev, eventType: event.target.value }))}>
          <option value="COMMUNITY">От жителей</option>
          <option value="OFFICIAL">Официальное</option>
        </select>
        <input className="rounded border px-2 py-1 sm:col-span-2 lg:col-span-3" placeholder="Описание" value={eventForm.description} onChange={(event) => setEventForm((prev) => ({ ...prev, description: event.target.value }))} />
        <button type="button" className="rounded bg-slate-200 px-2 py-1 text-sm" onClick={onGeocode}>Определить точку по адресу</button>
        <button type="submit" className="rounded bg-emerald-600 px-2 py-1 text-white">
          {editingEventId ? "Сохранить" : "Отправить"}
        </button>
      </form>
      {eventForm.imageUrl && (
        <img src={eventForm.imageUrl} alt="Превью" className="mt-2 max-h-40 rounded border object-cover" />
      )}
      {eventSubmitError && <p className="mt-2 text-xs text-rose-600">{eventSubmitError}</p>}
      {eventSubmitMessage && <p className="mt-2 text-xs text-emerald-700">{eventSubmitMessage}</p>}
      <p className="mt-2 text-xs text-slate-500">
        Фото: URL или файл до 2 МБ. Для точного поиска адреса: город, улица, дом. Например: «Омск, Ленина, 10».
      </p>
      {geocodeCandidates.length > 0 && (
        <div className="mt-2 rounded border p-2">
          <p className="mb-1 text-xs font-medium">Выберите точный адрес:</p>
          <div className="space-y-1">
            {geocodeCandidates.map((candidate) => (
              <button
                key={`${candidate.latitude}-${candidate.longitude}`}
                type="button"
                className="block w-full rounded bg-slate-100 px-2 py-1 text-left text-xs"
                onClick={() => onApplyCandidate(candidate)}
              >
                {candidate.displayName}
              </button>
            ))}
          </div>
        </div>
      )}
      <p className="mt-2 text-xs text-slate-500">Либо кликните на карту ниже, чтобы выбрать точку вручную.</p>
    </section>
  );
}
