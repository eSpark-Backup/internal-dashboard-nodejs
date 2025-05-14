import pool from "../../config/db.js";
import multer from "multer";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import bcrypt from "bcrypt";
import { validateFile } from "../../utils/validateFiles.js";
import { checkEmployeeDuplicates } from "../../utils/employee.js";
import {logger} from "../../helpers/logger.js";

dotenv.config();

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = "uploads/";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const upload = multer({ storage });

const addEmployee = async (req, res) => {
  const client = await pool.connect();
  const talentEmail = process.env.TALENT_EMAIL;

  try {
    const {
      employee_id,
      first_name,
      last_name,
      gender,
      dob,
      email,
      personal_email,
      marital_status,
      emergency_contact,
      joining_date,
      role,
      job_title,
      company,
      punch_timings,
      ending_date,
      job_status,
      starting_date,
      phone_number,
      casual_leaves,
      sick_leaves,
      annual_leaves,
      hajj_leaves,
      paid_leaves,
      unpaid_leaves,
      password,
    } = req.body;

    const imageFile = req.files?.image?.[0];
    const resumeFile = req.files?.resume?.[0];

    const image = imageFile?.filename;
    const resume = resumeFile?.filename;

    const fileErrors = {};
    const imageValidationErrors = validateFile({
      file: imageFile,
      name: "image",
      allowedTypes: ["image/jpeg", "image/png", "image/jpg", "image/svg"],
      maxSizeMB: 5,
    });

    const resumeValidationErrors = validateFile({
      file: resumeFile,
      name: "resume",
      allowedTypes: ["application/pdf"],
      maxSizeMB: 5,
    });

    Object.assign(fileErrors, imageValidationErrors || {});
    Object.assign(fileErrors, resumeValidationErrors || {});

    if (Object.keys(fileErrors).length > 0) {
      return res.status(400).json(fileErrors);
    }

    await client.query("BEGIN");

    const { rows } = await client.query(
      `SELECT employee_id, email, personal_email
   FROM eSparkTalentAPI_employee
   WHERE employee_id = $1 OR email = $2 OR personal_email = $3`,
      [employee_id, email, personal_email]
    );

    const duplicateErrors = checkEmployeeDuplicates(rows, {
      employee_id,
      email,
      personal_email,
    });

    if (Object.keys(duplicateErrors).length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json(duplicateErrors);
    }

    const { rows: existingUser } = await client.query(
      `SELECT id FROM eSparkTalentAPI_end_user WHERE email = $1`,
      [email]
    );
    if (existingUser.length > 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        email: ["User already exists with this email."],
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await client.query(
      `INSERT INTO eSparkTalentAPI_end_user (username, email, password, role, is_superuser, is_active, is_staff)
       VALUES ($1, $2, $3, $4, false, true, false)`,
      [`${first_name} ${last_name}`, email, hashedPassword, "employee"]
    );

    const empResult = await client.query(
      `INSERT INTO eSparkTalentAPI_employee (
        employee_id, first_name, last_name, gender, dob, phone_number,
        email, personal_email, marital_status, image, resume, emergency_contact,
        joining_date, starting_date, ending_date, job_title, job_status,
        role, company, punch_timings
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
      ) RETURNING id, image`,
      [
        employee_id,
        first_name,
        last_name,
        gender,
        dob,
        phone_number,
        email,
        personal_email,
        marital_status,
        image,
        resume,
        emergency_contact,
        joining_date,
        starting_date,
        ending_date,
        job_title,
        job_status,
        role,
        company,
        punch_timings,
      ]
    );

    if (empResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Failed to add employee.",
      });
    }

    const emp = empResult.rows[0];

    await client.query(
      `INSERT INTO eSparkTalentAPI_leave_balance (
        employee_id, casual_leaves, sick_leaves, annual_leaves,
        hajj_leaves, paid_leaves, unpaid_leaves
      ) VALUES (
        $1,
        jsonb_build_object('total', $2::int, 'availed', 0, 'balance', $2::int, 'status', 'enable'),
        jsonb_build_object('total', $3::int, 'availed', 0, 'balance', $3::int, 'status', 'enable'),
        jsonb_build_object('total', $4::int, 'availed', 0, 'balance', $4::int, 'status', 'enable'),
        jsonb_build_object('total', $5::int, 'availed', 0, 'balance', $5::int, 'status', 'enable'),
        jsonb_build_object('total', $6::int, 'availed', 0, 'balance', $6::int, 'status', 'enable'),
        jsonb_build_object('total', $7::int, 'availed', 0, 'balance', $7::int, 'status', 'enable')
      )`,
      [
        emp.id,
        casual_leaves,
        sick_leaves,
        annual_leaves,
        hajj_leaves,
        paid_leaves,
        unpaid_leaves,
      ]
    );

    const clientResult = await client.query(
      `SELECT id FROM eSparkTalentAPI_client WHERE email = $1`,
      [talentEmail]
    );

    if (clientResult.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({
        message: "Failed to add employee.",
      });
    }
    
    const clientId = clientResult.rows[0].id;

    await client.query(
      `INSERT INTO eSparkTalentAPI_outsource_employees (
        client_id, employee_id, job_title, country, role_type,
        employment_term, joining_date, salary
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [clientId, emp.id, job_title, "Pakistan", role, "", joining_date, 0]
    );

    await client.query("COMMIT");
    
    logger.info(`${first_name} ${last_name} is added successfully`);
    return res.status(201).json({
      message: `${first_name} ${last_name} is added successfully`,
      id: emp.id,
      image: `/uploads/${emp.image}`,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    logger.error("Add employee error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  } finally {
    client.release();
  }
};
export default addEmployee;
