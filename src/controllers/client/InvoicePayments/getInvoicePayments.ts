import pool from "../../../config/db.js";
import { logger } from "../../../helpers/logger.js";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;
const DEFAULT_PAGE = 1;
const VALID_SORT_FIELDS = new Set([
  "invoice_date",
  "due_date",
  "invoice_amount",
  "billing_month",
  "paid_at",
]);

const parseBooleanQuery = (value) => {
  if (value === undefined) return null;
  const normalized = String(value).trim().toLowerCase();
  if (normalized === "true") return true;
  if (normalized === "false") return false;
  return undefined;
};

const getInvoicePayments = async (req, res) => {
  const email = req.user?.email;
  if (!email) {
    return res
      .status(401)
      .json({ message: "Missing authenticated user email" });
  }

  const {
    payment_status,
    q,
    sort_by,
    sort_order,
    invoice_type,
    start_date,
    end_date,
    is_overdue,
    is_payment_due,
    payment_method,
    limit: limitQuery,
    page: pageQuery,
    offset: offsetQuery,
  } = req.query || {};

  const limit = limitQuery ? Number(limitQuery) : DEFAULT_LIMIT;
  const page = pageQuery ? Number(pageQuery) : undefined;
  const offset = offsetQuery ? Number(offsetQuery) : undefined;

  const isOverdue = parseBooleanQuery(is_overdue);
  const isPaymentDue = parseBooleanQuery(is_payment_due);
  const paymentMethod = payment_method ? payment_method.trim() : null;
  const startDate = start_date || null;
  const endDate = end_date || null;

  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) {
    return res.status(400).json({
      message: "limit must be an integer between 1 and 100",
    });
  }

  if (page !== undefined && (!Number.isInteger(page) || page < 1)) {
    return res.status(400).json({
      message: "page must be an integer greater than or equal to 1",
    });
  }

  if (offset !== undefined && (!Number.isInteger(offset) || offset < 0)) {
    return res.status(400).json({
      message: "offset must be a non-negative integer",
    });
  }

  if (isOverdue === undefined) {
    return res.status(400).json({
      message: "is_overdue must be true or false",
    });
  }

  if (isPaymentDue === undefined) {
    return res.status(400).json({
      message: "is_payment_due must be true or false",
    });
  }

  if (start_date && Number.isNaN(Date.parse(start_date))) {
    return res.status(400).json({ message: "start_date must be a valid date" });
  }

  if (end_date && Number.isNaN(Date.parse(end_date))) {
    return res.status(400).json({ message: "end_date must be a valid date" });
  }

  const currentPage =
    page !== undefined
      ? page
      : offset !== undefined
        ? Math.floor(offset / limit) + 1
        : DEFAULT_PAGE;

  const computedOffset = (currentPage - 1) * limit;
  const orderDirection =
    String(sort_order || "desc").toUpperCase() === "ASC" ? "ASC" : "DESC";
  const orderBy = VALID_SORT_FIELDS.has(sort_by) ? sort_by : "created_at";

  try {
    const clientResult = await pool.query(
      "SELECT id FROM eSparkTalentAPI_client WHERE email = $1 LIMIT 1",
      [email],
    );

    if (clientResult.rowCount === 0) {
      return res
        .status(404)
        .json({ message: "Client not found for authenticated email" });
    }

    const clientId = clientResult.rows[0].id;
    const searchTerm = q ? `%${q}%` : null;
    const queryParams = [
      clientId,
      payment_status || null,
      invoice_type || null,
      searchTerm,
      isOverdue,
      isPaymentDue,
      paymentMethod || null,
      startDate,
      endDate,
    ];

    const employeeInvoiceQuery = `
      SELECT
        ei.id,
        'employee_invoice' AS type,
        COALESCE(e.first_name, '') || ' ' || COALESCE(e.last_name, '') AS employee_name,
        e.employee_id AS employee_code,
        ei.invoice_date,
        ei.due_date,
        ei.billing_month,
        ei.invoice_amount,
        ei.currency,
        ei.payment_status,
        ei.is_payment_due,
        ei.invoice_type,
        ei.payment_method,
        ei.payment_reference,
        ei.paid_at,
        CASE
          WHEN ei.payment_status != 'paid' AND ei.due_date < CURRENT_DATE THEN TRUE
          ELSE FALSE
        END AS is_overdue,
        CASE
          WHEN ei.payment_status != 'paid' AND ei.is_payment_due = TRUE THEN TRUE
          ELSE FALSE
        END AS can_pay,
        ei.created_at
      FROM eSparkTalentAPI_employee_invoice ei
      JOIN eSparkTalentAPI_employee e ON ei.employee_id = e.id
      WHERE ei.client_id = $1
        AND ($2::text IS NULL OR ei.payment_status = $2)
        AND ($3::text IS NULL OR ei.invoice_type = $3)
        AND ($5::boolean IS NULL OR ((ei.payment_status != 'paid' AND ei.due_date < CURRENT_DATE) = $5))
        AND ($6::boolean IS NULL OR ei.is_payment_due = $6)
        AND ($7::text IS NULL OR LOWER(ei.payment_method) = LOWER($7))
        AND ($8::date IS NULL OR ei.invoice_date >= $8)
        AND ($9::date IS NULL OR ei.invoice_date <= $9)  
        AND ($4::text IS NULL OR (
          (COALESCE(e.first_name, '') || ' ' || COALESCE(e.last_name, '')) ILIKE $4
          OR ei.payment_reference ILIKE $4
        ))
    `;

    const otherPaymentQuery = `
      SELECT
        op.id,
        'other_payment' AS type,
        NULL AS employee_name,
        NULL AS employee_code,
        op.invoice_date,
        op.due_date,
        NULL::date AS billing_month,
        op.invoice_amount,
        op.currency,
        op.payment_status,
        op.is_payment_due,
        'CUSTOM' AS invoice_type,
        op.payment_method,
        op.payment_reference,
        op.paid_at,
        CASE
          WHEN op.payment_status != 'paid' AND op.due_date < CURRENT_DATE THEN TRUE
          ELSE FALSE
        END AS is_overdue,
        CASE
          WHEN op.payment_status != 'paid' AND op.is_payment_due = TRUE THEN TRUE
          ELSE FALSE
        END AS can_pay,
        op.created_at
      FROM eSparkTalentAPI_other_payment op
      WHERE op.client_id = $1
        AND ($2::text IS NULL OR op.payment_status = $2)
        AND ($5::boolean IS NULL OR ((op.payment_status != 'paid' AND op.due_date < CURRENT_DATE) = $5))
        AND ($6::boolean IS NULL OR op.is_payment_due = $6)
        AND ($7::text IS NULL OR LOWER(op.payment_method) = LOWER($7))
        AND ($8::date IS NULL OR op.invoice_date >= $8)
        AND ($9::date IS NULL OR op.invoice_date <= $9)
        AND ($4::text IS NULL OR (
          op.payment_reference ILIKE $4
        ))
    `;

    const dataQuery = `
      WITH filtered_invoices AS (
        ${employeeInvoiceQuery}
        UNION ALL
        ${otherPaymentQuery}
      )
      SELECT
        id,
        type,
        employee_name,
        employee_code,
        TO_CHAR(invoice_date, 'YYYY-MM-DD') AS invoice_date,
        TO_CHAR(due_date, 'YYYY-MM-DD') AS due_date,
        TO_CHAR(billing_month, 'YYYY-MM-DD') AS billing_month,
        invoice_amount,
        currency,
        payment_status,
        is_payment_due,
        invoice_type,
        payment_method,
        payment_reference,
        TO_CHAR(paid_at, 'YYYY-MM-DD HH24:MI:SS') AS paid_at,
        is_overdue,
        can_pay
      FROM filtered_invoices
      ORDER BY ${orderBy} ${orderDirection}, id DESC
      LIMIT $10
      OFFSET $11
    `;

    const statsQuery = `
      WITH filtered_invoices AS (
        ${employeeInvoiceQuery}
        UNION ALL
        ${otherPaymentQuery}
      )
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE payment_status != 'paid')::int AS unpaid_count,
        COUNT(*) FILTER (WHERE payment_status = 'paid')::int AS paid_count,
        COUNT(*) FILTER (WHERE is_overdue)::int AS overdue_count,
        COALESCE(SUM(invoice_amount) FILTER (WHERE payment_status != 'paid'), 0)::numeric AS total_unpaid_amount
      FROM filtered_invoices
    `;

    const [dataResult, statsResult] = await Promise.all([
      pool.query(dataQuery, [...queryParams, limit, computedOffset]),
      pool.query(statsQuery, queryParams),
    ]);

    const stats = statsResult.rows[0] || {
      total: 0,
      unpaid_count: 0,
      paid_count: 0,
      overdue_count: 0,
      total_unpaid_amount: 0,
    };

    const invoicePayments = dataResult.rows.map((row) => ({
      ...row,
      invoice_amount:
        row.invoice_amount !== null ? Number(row.invoice_amount) : null,
    }));

    return res.status(200).json({
      //invoice_payments: invoicePayments,
      employee_invoices: invoicePayments.filter(
        (item) => item.type === "employee_invoice",
      ),
      other_payments: invoicePayments.filter(
        (item) => item.type === "other_payment",
      ),
      statistics: {
        total_invoices: stats.total,
        unpaid_count: stats.unpaid_count,
        paid_count: stats.paid_count,
        overdue_count: stats.overdue_count,
        total_unpaid_amount: Number(stats.total_unpaid_amount),
      },
      pagination: {
        total: stats.total,
        total_pages: Math.max(1, Math.ceil(stats.total / limit)),
        current_page: currentPage,
        per_page: limit,
        next_page:
          currentPage < Math.max(1, Math.ceil(stats.total / limit))
            ? currentPage + 1
            : null,
        prev_page: currentPage > 1 ? currentPage - 1 : null,
        from: computedOffset + 1,
        to: Math.min(computedOffset + limit, stats.total),
        first_page: 1,
        last_page: Math.max(1, Math.ceil(stats.total / limit)),
      },
    });
  } catch (error) {
    logger.error(`Error getting invoice payments: ${error}`);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export default getInvoicePayments;
