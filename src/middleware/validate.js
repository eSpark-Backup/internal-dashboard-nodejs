import fs from "fs/promises";

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
    
    try {
      if (req.file?.path) {
        await fs.unlink(req.file.path);
      }
      if (Array.isArray(req.files)) {
        for (const file of req.files) {
          await fs.unlink(file.path);
        }
      } else if (typeof req.files === 'object') {
        for (const key in req.files) {
          for (const file of req.files[key]) {
            await fs.unlink(file.path);
          }
        }
      }
    } catch (unlinkErr) {
      console.error("Error deleting uploaded files:", unlinkErr);
      return res.status(500).json({ message: "Internal server error" });
    }
    
    return res.status(400).json(formattedErrors);
  }
};

export default validateSchema;


