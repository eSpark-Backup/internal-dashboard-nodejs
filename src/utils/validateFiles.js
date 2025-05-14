/**
 * Validates a single uploaded file.
 * @param {Object} options
 * @param {Object} options.file - The file object (from multer).
 * @param {string} options.name - The field name (e.g., "image").
 * @param {boolean} [options.required=true] - Whether the file is required.
 * @param {string[]} [options.allowedTypes=[]] - Allowed MIME types.
 * @param {number} [options.maxSizeMB=2] - Maximum file size in MB.
 * @returns {Object|null} - Returns { [name]: [errors] } or null.
 */
export function validateFile({
  file,
  name,
  required = true,
  allowedTypes = [],
  maxSizeMB = 5,
}) {
  const errors = [];

  if (!file) {
    if (required) {
      errors.push(`${name} is required.`);
    }
  } else {
    if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
      errors.push(`${name} must be of type: ${allowedTypes.join(", ")}.`);
    }

    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      errors.push(`${name} must be smaller than ${maxSizeMB}MB.`);
    }
  }

  return errors.length > 0 ? { [name]: errors } : null;
}
