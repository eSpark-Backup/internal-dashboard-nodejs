ALTER TABLE eSparkTalentAPI_other_payment
ALTER COLUMN invoice_amount TYPE NUMERIC(10, 2);

ALTER TABLE eSparkTalentAPI_employee_invoice
ALTER COLUMN invoice_amount TYPE NUMERIC(10, 2);
