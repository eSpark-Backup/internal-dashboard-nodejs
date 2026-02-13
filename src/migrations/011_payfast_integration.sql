-- ============================================================================
-- PayFast Integration Schema
-- Migration: 011_payfast_integration.sql
-- Description: Adds tables and columns for PayFast payment processing
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Enhance existing eSparkTalentAPI_employee_invoice table
-- ----------------------------------------------------------------------------
ALTER TABLE eSparkTalentAPI_employee_invoice 
ADD COLUMN IF NOT EXISTS is_payment_due BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS invoice_type VARCHAR(20) DEFAULT 'SALARY' CHECK (invoice_type IN ('SALARY', 'CUSTOM')),
ADD COLUMN IF NOT EXISTS billing_month DATE,
ADD COLUMN IF NOT EXISTS basket_id VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255),
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_employee_invoice_basket_id ON eSparkTalentAPI_employee_invoice(basket_id);
CREATE INDEX IF NOT EXISTS idx_employee_invoice_billing_month ON eSparkTalentAPI_employee_invoice(billing_month);
CREATE INDEX IF NOT EXISTS idx_employee_invoice_is_payment_due ON eSparkTalentAPI_employee_invoice(is_payment_due);
CREATE INDEX IF NOT EXISTS idx_employee_invoice_invoice_type ON eSparkTalentAPI_employee_invoice(invoice_type);

-- ----------------------------------------------------------------------------
-- 2. Enhance existing eSparkTalentAPI_other_payment table
-- ----------------------------------------------------------------------------
ALTER TABLE eSparkTalentAPI_other_payment
ADD COLUMN IF NOT EXISTS is_payment_due BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS basket_id VARCHAR(100) UNIQUE,
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255),
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_other_payment_basket_id ON eSparkTalentAPI_other_payment(basket_id);
CREATE INDEX IF NOT EXISTS idx_other_payment_is_payment_due ON eSparkTalentAPI_other_payment(is_payment_due);

-- ----------------------------------------------------------------------------
-- 3. Create eSparkTalentAPI_payfast_tokens table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eSparkTalentAPI_payfast_tokens (
    id SERIAL PRIMARY KEY,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    merchant_id VARCHAR(50) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payfast_tokens_expires_at ON eSparkTalentAPI_payfast_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_payfast_tokens_merchant_id ON eSparkTalentAPI_payfast_tokens(merchant_id);

-- ----------------------------------------------------------------------------
-- 4. Create eSparkTalentAPI_payment_transactions table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eSparkTalentAPI_payment_transactions (
    id SERIAL PRIMARY KEY,
    invoice_id BIGINT,
    invoice_type VARCHAR(20) CHECK (invoice_type IN ('SALARY', 'CUSTOM')),
    client_id BIGINT NOT NULL REFERENCES eSparkTalentAPI_client(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'PKR',
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED', 'CANCELLED')),
    payfast_transaction_id VARCHAR(255),
    payfast_basket_id VARCHAR(100),
    payment_method VARCHAR(50),
    bank_code VARCHAR(50),
    instrument_id INTEGER,
    instrument_token TEXT,
    error_code VARCHAR(10),
    error_message TEXT,
    validation_hash TEXT,
    initiated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payment_transactions_invoice_id ON eSparkTalentAPI_payment_transactions(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_client_id ON eSparkTalentAPI_payment_transactions(client_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_basket_id ON eSparkTalentAPI_payment_transactions(payfast_basket_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON eSparkTalentAPI_payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_payfast_txn_id ON eSparkTalentAPI_payment_transactions(payfast_transaction_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_invoice_type ON eSparkTalentAPI_payment_transactions(invoice_type);

-- ----------------------------------------------------------------------------
-- 5. Create eSparkTalentAPI_bulk_payments table
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eSparkTalentAPI_bulk_payments (
    id SERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES eSparkTalentAPI_client(id) ON DELETE CASCADE,
    total_amount NUMERIC(12, 2) NOT NULL,
    invoice_ids JSONB NOT NULL,
    invoice_type VARCHAR(20) DEFAULT 'SALARY' CHECK (invoice_type IN ('SALARY', 'CUSTOM', 'MIXED')),
    transaction_id INTEGER REFERENCES eSparkTalentAPI_payment_transactions(id) ON DELETE SET NULL,
    basket_id VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SUCCESS', 'FAILED', 'CANCELLED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bulk_payments_client_id ON eSparkTalentAPI_bulk_payments(client_id);
CREATE INDEX IF NOT EXISTS idx_bulk_payments_basket_id ON eSparkTalentAPI_bulk_payments(basket_id);
CREATE INDEX IF NOT EXISTS idx_bulk_payments_status ON eSparkTalentAPI_bulk_payments(status);

-- ----------------------------------------------------------------------------
-- 6. Create eSparkTalentAPI_payfast_logs table (audit trail)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eSparkTalentAPI_payfast_logs (
    id SERIAL PRIMARY KEY,
    endpoint VARCHAR(255) NOT NULL,
    method VARCHAR(10) NOT NULL,
    request_payload JSONB,
    response_payload JSONB,
    status_code INTEGER,
    basket_id VARCHAR(100),
    error TEXT,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_payfast_logs_basket_id ON eSparkTalentAPI_payfast_logs(basket_id);
CREATE INDEX IF NOT EXISTS idx_payfast_logs_created_at ON eSparkTalentAPI_payfast_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_payfast_logs_endpoint ON eSparkTalentAPI_payfast_logs(endpoint);

-- ----------------------------------------------------------------------------
-- 7. Create eSparkTalentAPI_client_payment_methods table (for recurring/saved payments)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS eSparkTalentAPI_client_payment_methods (
    id SERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES eSparkTalentAPI_client(id) ON DELETE CASCADE,
    instrument_token TEXT NOT NULL,
    payment_type VARCHAR(20) CHECK (payment_type IN ('account', 'card', 'wallet')),
    bank_name VARCHAR(100),
    bank_code VARCHAR(50),
    last_four_digits VARCHAR(4),
    is_default BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_client_payment_methods_client_id ON eSparkTalentAPI_client_payment_methods(client_id);
CREATE INDEX IF NOT EXISTS idx_client_payment_methods_is_default ON eSparkTalentAPI_client_payment_methods(is_default);
CREATE INDEX IF NOT EXISTS idx_client_payment_methods_is_active ON eSparkTalentAPI_client_payment_methods(is_active);

-- ----------------------------------------------------------------------------
-- 8. Enhance eSparkTalentAPI_client table
-- ----------------------------------------------------------------------------
ALTER TABLE eSparkTalentAPI_client 
ADD COLUMN IF NOT EXISTS invoice_due_date INTEGER DEFAULT 31 CHECK (invoice_due_date BETWEEN 1 AND 31),
ADD COLUMN IF NOT EXISTS preferred_payment_method VARCHAR(50);

CREATE INDEX IF NOT EXISTS idx_client_invoice_due_date ON eSparkTalentAPI_client(invoice_due_date);

-- ----------------------------------------------------------------------------
-- 9. Apply updated_at triggers to new tables
-- ----------------------------------------------------------------------------
-- CREATE TRIGGER update_eSparkTalentAPI_payfast_tokens_updated_at
--     BEFORE UPDATE ON eSparkTalentAPI_payfast_tokens
--     FOR EACH ROW
--     EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_eSparkTalentAPI_payment_transactions_updated_at
--     BEFORE UPDATE ON eSparkTalentAPI_payment_transactions
--     FOR EACH ROW
--     EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_eSparkTalentAPI_bulk_payments_updated_at
--     BEFORE UPDATE ON eSparkTalentAPI_bulk_payments
--     FOR EACH ROW
--     EXECUTE FUNCTION update_updated_at_column();

-- CREATE TRIGGER update_eSparkTalentAPI_client_payment_methods_updated_at
--     BEFORE UPDATE ON eSparkTalentAPI_client_payment_methods
--     FOR EACH ROW
--     EXECUTE FUNCTION update_updated_at_column();

-- ----------------------------------------------------------------------------
-- 9. Apply updated_at triggers to new tables (drop if exists then create)
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS update_eSparkTalentAPI_payfast_tokens_updated_at ON eSparkTalentAPI_payfast_tokens;
CREATE TRIGGER update_eSparkTalentAPI_payfast_tokens_updated_at
BEFORE UPDATE ON eSparkTalentAPI_payfast_tokens
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_eSparkTalentAPI_payment_transactions_updated_at ON eSparkTalentAPI_payment_transactions;
CREATE TRIGGER update_eSparkTalentAPI_payment_transactions_updated_at
BEFORE UPDATE ON eSparkTalentAPI_payment_transactions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_eSparkTalentAPI_bulk_payments_updated_at ON eSparkTalentAPI_bulk_payments;
CREATE TRIGGER update_eSparkTalentAPI_bulk_payments_updated_at
BEFORE UPDATE ON eSparkTalentAPI_bulk_payments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_eSparkTalentAPI_client_payment_methods_updated_at ON eSparkTalentAPI_client_payment_methods;
CREATE TRIGGER update_eSparkTalentAPI_client_payment_methods_updated_at
BEFORE UPDATE ON eSparkTalentAPI_client_payment_methods
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- End of migration
-- ============================================================================