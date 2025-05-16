const validateSchema = (schema) => async (req, res, next) => {
  try {
    await schema.validate(
      {
        body: req.body,
        query: req.query,
        params: req.params,
      },
      { abortEarly: false }
    );
    next();
  } catch (err) {
    const formattedErrors = {};
    err.inner.forEach((e) => {
      const path = e.path?.replace(/^(body|query|params)\./, "");
      if (path && !formattedErrors[path]) {
        formattedErrors[path] = [e.message];
      }
    });
    return res.status(400).json(formattedErrors);
  }
};

export default validateSchema;
