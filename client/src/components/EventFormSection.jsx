import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import EventPointPicker from "./EventPointPicker";
import { fieldErrorClass } from "../utils";

function FormField({ label, error, children, className = "" }) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}
      {children}
      {error && <span className="text-xs text-rose-600">{error}</span>}
    </div>
  );
}

export default function EventFormSection({
  editingEventId,
  eventForm,
  setEventForm,
  meta,
  fieldErrors,
  eventSubmitError,
  eventSubmitMessage,
  organizerPreview,
  onSubmit,
  onReset,
  onImageFileChange,
  onEditProfile,
  onBack,
  userRole
}) {
  const inputClass = (field) =>
    `w-full rounded-lg border px-3 py-2 text-sm ${fieldErrorClass(Boolean(fieldErrors[field]))}`;

  const hasMarker =
    Number.isFinite(Number(eventForm.latitude)) && Number.isFinite(Number(eventForm.longitude));

  return (
    <section className="card-surface mx-auto max-w-6xl p-6 sm:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
        <div className="min-w-0">
          {onBack && (
            <button type="button" className="btn-ghost mb-2" onClick={onBack}>
              ← Назад к ленте
            </button>
          )}
          <h2 className="text-2xl font-black text-[#054752]">
            {editingEventId ? "Редактировать мероприятие" : "Создать мероприятие"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            После отправки мероприятие попадёт на модерацию и появится в ленте после одобрения.
          </p>
        </div>
        {editingEventId && (
          <button type="button" className="rounded-lg bg-slate-100 px-3 py-1.5 text-sm" onClick={onReset}>
            Отменить редактирование
          </button>
        )}
      </div>

      <div className="mb-6 rounded-lg border border-indigo-100 bg-indigo-50/50 p-4 text-sm">
        <p className="mb-2 font-medium text-slate-800">Контакты организатора (из профиля)</p>
        {organizerPreview?.name ? (
          <ul className="space-y-0.5 text-slate-600">
            <li>{organizerPreview.name}</li>
            {organizerPreview.phone && <li>Телефон: {organizerPreview.phone}</li>}
            {organizerPreview.telegram && <li>Telegram: {organizerPreview.telegram}</li>}
            {organizerPreview.vkUrl && <li>VK: {organizerPreview.vkUrl}</li>}
          </ul>
        ) : (
          <p className="text-amber-700">Укажите имя и фамилию в профиле</p>
        )}
        <button type="button" className="mt-2 text-sm text-indigo-600 underline" onClick={onEditProfile}>
          Перейти в профиль
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form onSubmit={onSubmit} className="space-y-5">
          <FormField label="Название *" error={fieldErrors.title}>
            <input
              className={inputClass("title")}
              value={eventForm.title}
              onChange={(event) => setEventForm((prev) => ({ ...prev, title: event.target.value }))}
            />
          </FormField>

          <FormField label="Описание" error={fieldErrors.description}>
            <textarea
              className={`${inputClass("description")} min-h-[100px]`}
              value={eventForm.description}
              onChange={(event) => setEventForm((prev) => ({ ...prev, description: event.target.value }))}
            />
          </FormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField label="Категория *" error={fieldErrors.categoryId}>
              <select
                className={inputClass("categoryId")}
                value={eventForm.categoryId}
                onChange={(event) => setEventForm((prev) => ({ ...prev, categoryId: event.target.value }))}
              >
                <option value="">Выберите категорию</option>
                {(meta?.categories || []).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </FormField>

            {userRole === "ADMIN" && (
              <FormField label="Тип мероприятия">
                <select
                  className={inputClass("eventType")}
                  value={eventForm.eventType}
                  onChange={(event) => setEventForm((prev) => ({ ...prev, eventType: event.target.value }))}
                >
                  <option value="COMMUNITY">От жителей</option>
                  <option value="OFFICIAL">Официальное</option>
                </select>
              </FormField>
            )}

            <FormField label="Начало *" error={fieldErrors.startsAt}>
              <input
                type="datetime-local"
                className={inputClass("startsAt")}
                value={eventForm.startsAt}
                onChange={(event) => setEventForm((prev) => ({ ...prev, startsAt: event.target.value }))}
              />
            </FormField>

            <FormField label="Окончание *" error={fieldErrors.endsAt}>
              <input
                type="datetime-local"
                className={inputClass("endsAt")}
                value={eventForm.endsAt}
                onChange={(event) => setEventForm((prev) => ({ ...prev, endsAt: event.target.value }))}
              />
            </FormField>
          </div>

          <FormField label="Адрес *" error={fieldErrors.address}>
            <input
              className={inputClass("address")}
              placeholder="Омск, Ленина, 10"
              value={eventForm.address}
              onChange={(event) => setEventForm((prev) => ({ ...prev, address: event.target.value }))}
            />
            <p className="text-xs text-slate-400">Формат: город, улица, дом</p>
          </FormField>

          <fieldset className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <legend className="px-1 text-sm font-medium text-slate-800">
              Вы хотите сделать свой адрес публичным?
            </legend>
            <div className="mt-2 space-y-2 text-sm">
              <label className="flex cursor-pointer gap-2">
                <input
                  type="radio"
                  name="addressPublic"
                  checked={eventForm.addressPublic === true}
                  onChange={() => setEventForm((prev) => ({ ...prev, addressPublic: true }))}
                />
                <span>Да — адрес и метка на карте видны всем в ленте</span>
              </label>
              <label className="flex cursor-pointer gap-2">
                <input
                  type="radio"
                  name="addressPublic"
                  checked={eventForm.addressPublic !== true}
                  onChange={() => setEventForm((prev) => ({ ...prev, addressPublic: false }))}
                />
                <span>Нет — только участникам с одобренной заявкой</span>
              </label>
            </div>
          </fieldset>

          <FormField label="Лимит участников" error={fieldErrors.maxParticipants}>
            <input
              type="number"
              min="1"
              className={inputClass("maxParticipants")}
              placeholder="Пусто — без ограничения"
              value={eventForm.maxParticipants}
              onChange={(event) => setEventForm((prev) => ({ ...prev, maxParticipants: event.target.value }))}
            />
          </FormField>

          <div className="rounded-lg border border-dashed border-slate-200 p-4">
            <p className="mb-2 text-sm font-medium text-slate-700">Обложка</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <input
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                placeholder="URL изображения"
                value={eventForm.imageUrl}
                onChange={(event) => setEventForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
              />
              <input
                type="file"
                accept="image/*"
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
                onChange={onImageFileChange}
              />
            </div>
            {eventForm.imageUrl && (
              <img src={eventForm.imageUrl} alt="Превью" className="mt-3 max-h-48 rounded-lg border object-cover" />
            )}
          </div>

          {eventSubmitError && <p className="text-sm text-rose-600">{eventSubmitError}</p>}
          {eventSubmitMessage && <p className="text-sm text-emerald-700">{eventSubmitMessage}</p>}

          <div className="flex flex-wrap gap-3 border-t border-slate-100 pt-4">
          <button type="submit" className="btn-primary">
              {editingEventId ? "Сохранить изменения" : "Отправить на модерацию"}
            </button>
            {!editingEventId && (
              <button type="button" className="btn-secondary" onClick={onReset}>
                Очистить форму
              </button>
            )}
          </div>
        </form>

        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">Точка на карте *</p>
          <p className="mb-2 text-xs text-slate-500">Кликните на карту, чтобы поставить метку мероприятия (обязательно).</p>
          {fieldErrors.mapMarker && (
            <p className="mb-2 text-xs text-rose-600">{fieldErrors.mapMarker}</p>
          )}
          <div className="overflow-hidden rounded-lg border">
            <MapContainer center={[54.9885, 73.3242]} zoom={12} style={{ height: "420px", width: "100%" }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <EventPointPicker setEventForm={setEventForm} />
              {hasMarker && (
                <Marker position={[Number(eventForm.latitude), Number(eventForm.longitude)]}>
                  <Popup>Место мероприятия</Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
          {hasMarker ? (
            <p className="mt-2 text-xs text-emerald-700">Метка установлена</p>
          ) : (
            <p className="mt-2 text-xs text-amber-700">Метка не выбрана — укажите точку на карте</p>
          )}
        </div>
      </div>
    </section>
  );
}
