const HttpError = require("../utils/http-error");

function validate(schema) {
  return (req, _res, next) => {
    const parsed = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params
    });

    if (!parsed.success) {
      return next(new HttpError(400, parsed.error.issues[0]?.message || "Invalid request"));
    }

    req.validated = parsed.data;
    return next();
  };
}

module.exports = validate;
