export const FAVORITES_KEY = "cultural-navigator:guest-favorites";
export const TOKEN_KEY = "cultural-navigator:token";
export const PAGE_SIZE = 10;

export const PAGES = {
  FEED: "feed",
  EVENT: "event",
  LOGIN: "login",
  REGISTER: "register",
  MODERATION: "moderation",
  PROFILE: "profile",
  PROFILE_EDIT: "profile-edit",
  USER: "user",
  MY_EVENTS: "my-events",
  ATTENDING: "attending",
  FAVORITES: "favorites",
  CREATE_EVENT: "create-event"
};

export const PAGE_TITLES = {
  feed: "Лента",
  event: "Мероприятие",
  login: "Вход",
  register: "Регистрация",
  moderation: "Модерация",
  profile: "Мой профиль",
  "profile-edit": "Редактирование",
  user: "Профиль",
  "my-events": "Мои мероприятия",
  attending: "Мои заявки",
  favorites: "Избранное",
  "create-event": "Создать мероприятие"
};

export const EMPTY_REGISTER_FORM = {
  firstName: "",
  lastName: "",
  email: "",
  login: "",
  password: "",
  passwordConfirm: "",
  acceptRules: false,
  ageStatus: "",
  gender: ""
};
