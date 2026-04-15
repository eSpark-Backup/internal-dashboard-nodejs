DO $$
BEGIN
    -- 1. Handle esparktalentapi_employee_invoice
    -- Drop the constraint if it exists by name using lowercase identifiers
    ALTER TABLE esparktalentapi_employee_invoice 
    DROP CONSTRAINT IF EXISTS esparktalentapi_employee_invoice_payment_status_check;

    -- Drop any anonymous constraints that match the pattern
    DECLARE
        constraint_record RECORD;
    BEGIN
        FOR constraint_record IN
            SELECT conname
            FROM pg_constraint c
            JOIN pg_class t ON c.conrelid = t.oid
            WHERE t.relname = 'esparktalentapi_employee_invoice'
              AND c.contype = 'c'
              AND pg_get_constraintdef(c.oid) LIKE '%payment_status IN (%'
        LOOP
            EXECUTE format('ALTER TABLE esparktalentapi_employee_invoice DROP CONSTRAINT %I', constraint_record.conname);
        END LOOP;
    END;

    -- Add the updated constraint
    ALTER TABLE esparktalentapi_employee_invoice
    ADD CONSTRAINT esparktalentapi_employee_invoice_payment_status_check
    CHECK (payment_status IN ('pending', 'processing', 'paid', 'under_review'));

    -- 2. Handle esparktalentapi_other_payment
    ALTER TABLE esparktalentapi_other_payment 
    DROP CONSTRAINT IF EXISTS esparktalentapi_other_payment_payment_status_check;

    DECLARE
        constraint_record_other RECORD;
    BEGIN
        FOR constraint_record_other IN
            SELECT conname
            FROM pg_constraint c
            JOIN pg_class t ON c.conrelid = t.oid
            WHERE t.relname = 'esparktalentapi_other_payment'
              AND c.contype = 'c'
              AND pg_get_constraintdef(c.oid) LIKE '%payment_status IN (%'
        LOOP
            EXECUTE format('ALTER TABLE esparktalentapi_other_payment DROP CONSTRAINT %I', constraint_record_other.conname);
        END LOOP;
    END;

    ALTER TABLE esparktalentapi_other_payment
    ADD CONSTRAINT esparktalentapi_other_payment_payment_status_check
    CHECK (payment_status IN ('pending', 'processing', 'paid', 'under_review'));

END $$;