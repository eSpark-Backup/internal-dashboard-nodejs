
CREATE TABLE eSparkTalentAPI_policy
(
    id           SERIAL PRIMARY KEY,
    policy_name  VARCHAR(255) NOT NULL,
    policy_doc   VARCHAR(100) NOT NULL,
    employee     BOOLEAN NOT NULL,
    client       BOOLEAN NOT NULL,
    description  VARCHAR(255),
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE eSparkTalentAPI_letter
(
    id          SERIAL PRIMARY KEY,
    email       VARCHAR(255) NOT NULL,
    issue_date  DATE NOT NULL,
    objective   VARCHAR(255) NOT NULL,
    letter      VARCHAR(100) NOT NULL,
    reason      VARCHAR(255),
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE eSparkTalentAPI_end_user
(
    id            BIGSERIAL PRIMARY KEY,
    last_login    TIMESTAMP WITH TIME ZONE,
    is_superuser  BOOLEAN NOT NULL,
    role          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password      VARCHAR(255) NOT NULL,
    is_active     BOOLEAN NOT NULL,
    is_staff      BOOLEAN NOT NULL,
    username      VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE eSparkTalentAPI_guide
(
    id           SERIAL PRIMARY KEY,
    guide_name   VARCHAR(255) NOT NULL,
    description  VARCHAR(255),
    language     VARCHAR(255) NOT NULL,
    guide_doc    VARCHAR(100) NOT NULL,
    employee     BOOLEAN NOT NULL,
    client       BOOLEAN NOT NULL,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE eSparkTalentAPI_notifications
(
    id           BIGSERIAL PRIMARY KEY,
    email        VARCHAR(255) NOT NULL,
    ref_id       INTEGER,
    notification_type VARCHAR(255) NOT NULL,
    description  VARCHAR(255),
    status       VARCHAR(50) NOT NULL CHECK (status IN ('pending', 'completed', 'rejected')),
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE eSparkTalentAPI_client
(
    id           BIGSERIAL PRIMARY KEY,
    client_id    VARCHAR(255) UNIQUE NOT NULL,
    first_name   VARCHAR(255) NOT NULL,
    last_name    VARCHAR(255) NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    email        VARCHAR(255) NOT NULL,
    country      VARCHAR(255),
    image        VARCHAR(100) NOT NULL,
    address      VARCHAR(255) NOT NULL, 
    join_date    DATE,
    phone_number VARCHAR(255),
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE eSparkTalentAPI_company_data
(
    id            SERIAL PRIMARY KEY,
    company_name  VARCHAR(200) NOT NULL,
    company_email VARCHAR(255) NOT NULL,
    website_url   VARCHAR(200),
    image         VARCHAR(100) NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE eSparkTalentAPI_employee
(  
    id           BIGSERIAL PRIMARY KEY,
    employee_id  VARCHAR(255) UNIQUE NOT NULL,
    first_name   VARCHAR(50) NOT NULL,
    last_name    VARCHAR(50) NOT NULL,
    gender       VARCHAR(10),
    dob          DATE,
    email        VARCHAR(255) UNIQUE NOT NULL,
    marital_status VARCHAR(20),
    image        VARCHAR(100) NOT NULL,
    emergency_no VARCHAR(255),
    resume       VARCHAR(100),
    emergency_contact JSONB,
    joining_date DATE,
    role         VARCHAR(50) NOT NULL,
    job_title    VARCHAR(255) NOT NULL,
    company      VARCHAR(255) NOT NULL,
    punch_timings  JSONB,
    ending_date  DATE,
    job_status   VARCHAR(255) NOT NULL,
    personal_email VARCHAR(255) NOT NULL,
    starting_date  DATE,
    phone_number VARCHAR(255) NOT NULL,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE eSparkTalentAPI_client_contract
(
    id           SERIAL PRIMARY KEY,
    contract_name VARCHAR(255) NOT NULL,
    client_id    BIGINT NOT NULL REFERENCES eSparkTalentAPI_client(id) ON DELETE CASCADE,
    date         DATE NOT NULL,
    contract_doc VARCHAR(100) NOT NULL,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE eSparkTalentAPI_employee_contract
(
    id           SERIAL PRIMARY KEY,
    employee_id  BIGINT NOT NULL REFERENCES eSparkTalentAPI_employee(id) ON DELETE CASCADE,
    date         DATE NOT NULL,
    contract_doc VARCHAR(100) NOT NULL,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE eSparkTalentAPI_time_sheet
(
    id           SERIAL PRIMARY KEY,
    client_id    BIGINT NOT NULL REFERENCES eSparkTalentAPI_client(id) ON DELETE CASCADE,
    employee_id  BIGINT NOT NULL REFERENCES eSparkTalentAPI_employee(id) ON DELETE CASCADE,
    record       JSONB NOT NULL,
    year         INTEGER NOT NULL,
    month        VARCHAR(255) NOT NULL,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE eSparkTalentAPI_hiring_request
(
    id           SERIAL PRIMARY KEY,
    client_id    BIGINT NOT NULL REFERENCES eSparkTalentAPI_client(id) ON DELETE CASCADE,
    role_type    VARCHAR(255) NOT NULL,
    gender       VARCHAR(255) NOT NULL,
    employment_term VARCHAR(255) NOT NULL,
    salary_range JSONB,
    country      VARCHAR(255) NOT NULL,
    hiring_start_date DATE NOT NULL,
    hiring_end_date DATE NOT NULL,
    comments VARCHAR(255) NOT NULL,
    job_description VARCHAR(100) NOT NULL,
    salary_currency VARCHAR(255) NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE eSparkTalentAPI_asset
(
    id           SERIAL PRIMARY KEY,
    employee_id   BIGINT REFERENCES eSparkTalentAPI_employee(id) ON DELETE CASCADE,
    asset_id     VARCHAR(255) NOT NULL,
    assigned_date DATE NOT NULL,
    assignee_name VARCHAR(255),
    assignee_email VARCHAR(255),
    gadget   VARCHAR(100) NOT NULL,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE eSparkTalentAPI_leave_balance
(
    id           SERIAL PRIMARY KEY,
    employee_id   BIGINT NOT NULL REFERENCES eSparkTalentAPI_employee(id) ON DELETE CASCADE,
    casual_leaves JSONB NOT NULL,
    sick_leaves JSONB NOT NULL,
    annual_leaves JSONB NOT NULL,
    unpaid_leaves JSONB NOT NULL,
    hajj_leaves JSONB NOT NULL,
    paid_leaves JSONB NOT NULL,
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE eSparkTalentAPI_leave_request
(
    id           SERIAL PRIMARY KEY,
    client_id    BIGINT NOT NULL REFERENCES eSparkTalentAPI_client(id) ON DELETE CASCADE,
    employee_id  BIGINT NOT NULL REFERENCES eSparkTalentAPI_employee(id) ON DELETE CASCADE,
    leave_type   VARCHAR(50) NOT NULL CHECK (leave_type IN ('annual', 'casual', 'sick', 'paid', 'hajj', 'unpaid')),
    start_date   DATE NOT NULL,
    end_date     DATE NOT NULL,
    count        INTEGER NOT NULL,
    reason       VARCHAR(255) NOT NULL,
    attachment   VARCHAR(100),
    status       VARCHAR(255) NOT NULL CHECK (status IN ('pending', 'completed', 'rejected')),
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE eSparkTalentAPI_interview_schedule
(
    id           SERIAL PRIMARY KEY,
    client_id    BIGINT NOT NULL REFERENCES eSparkTalentAPI_client(id) ON DELETE CASCADE,
    employee_name VARCHAR(255) NOT NULL,
    gender        VARCHAR(255) NOT NULL,
    role_type     VARCHAR(255) NOT NULL,
    employment_term VARCHAR(255) NOT NULL,
    interview_date_time TIMESTAMP NOT NULL,
    country       VARCHAR(255) NOT NULL,
    status        VARCHAR(255) NOT NULL CHECK (status IN ('short_list', 'pending', 'rejected', 'hold')),
    job_title     VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE eSparkTalentAPI_account_n_persmission
(
    id            SERIAL PRIMARY KEY,
    account_name  VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL,
    password      VARCHAR(255) NOT NULL,
    image         VARCHAR(100) NOT NULL,
    employee_perms JSONB NOT NULL,
    client_perms JSONB NOT NULL,
    leaves_perms JSONB NOT NULL,
    invoices_perms JSONB NOT NULL,
    policies_perms JSONB NOT NULL,
    guides_perms JSONB NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE eSparkTalentAPI_offshore_contracts
(
    id            SERIAL PRIMARY KEY,
    client_id     BIGINT NOT NULL REFERENCES eSparkTalentAPI_client(id) ON DELETE CASCADE,
    employee_id   BIGINT NOT NULL REFERENCES eSparkTalentAPI_employee(id) ON DELETE CASCADE,
    contract_name VARCHAR(255) NOT NULL,
    date    DATE NOT NULL,
    contract_doc VARCHAR(100) NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE eSparkTalentAPI_benefits
(
    id            SERIAL PRIMARY KEY,
    employee_id   BIGINT REFERENCES eSparkTalentAPI_employee(id) ON DELETE CASCADE,
    benefit  VARCHAR(100) NOT NULL,
    issue_date    DATE NOT NULL,
    description VARCHAR(255),
    card_id VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE eSparkTalentAPI_other_payment
(
    id            SERIAL PRIMARY KEY,
    client_id     BIGINT NOT NULL REFERENCES eSparkTalentAPI_client(id) ON DELETE CASCADE,
    invoice_reference VARCHAR(100) UNIQUE,
    invoice_date  DATE NOT NULL,
    due_date      DATE NOT NULL,
    invoice_amount INTEGER NOT NULL,
    invoice VARCHAR(100) NOT NULL,
    currency VARCHAR(255),
    payment_status VARCHAR(255) NOT NULL CHECK (payment_status IN ('pending', 'processing', 'paid')),
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE eSparkTalentAPI_employee_invoice
(
    id            SERIAL PRIMARY KEY,
    client_id    BIGINT NOT NULL REFERENCES eSparkTalentAPI_client(id) ON DELETE CASCADE,
    employee_id   BIGINT NOT NULL REFERENCES eSparkTalentAPI_employee(id) ON DELETE CASCADE,
    invoice_date  DATE NOT NULL,
    due_date      DATE NOT NULL,
    invoice_amount INTEGER NOT NULL,
    invoice VARCHAR(100) NOT NULL,
    currency VARCHAR(255),
    payment_status VARCHAR(255) NOT NULL CHECK (payment_status IN ('pending', 'processing', 'paid')),
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE eSparkTalentAPI_salary
(
    id            SERIAL PRIMARY KEY,
    employee_id   BIGINT NOT NULL REFERENCES eSparkTalentAPI_employee(id) ON DELETE CASCADE,
    date          DATE NOT NULL,
    gross_salary  INTEGER NOT NULL,
    tax_deduction REAL NOT NULL,
    net_salary    INTEGER NOT NULL,
    pay_slip      VARCHAR(100) NOT NULL,
    job_status    VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE eSparkTalentAPI_onboarding
(
    id            SERIAL PRIMARY KEY,
    client_id    BIGINT NOT NULL REFERENCES eSparkTalentAPI_client(id) ON DELETE CASCADE,
    employee_name VARCHAR(255) NOT NULL,
    gender        VARCHAR(255) NOT NULL,
    country       VARCHAR(255) NOT NULL,
    role_type     VARCHAR(255) NOT NULL,
    employment_term VARCHAR(255) NOT NULL,
    joining_date  DATE NOT NULL,
    notice_period VARCHAR(255) NOT NULL,
    salary        INTEGER NOT NULL,
    salary_currency VARCHAR(255) NOT NULL,
    job_title     VARCHAR(255) NOT NULL,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE eSparkTalentAPI_end_user_user_permissions
(
    id            SERIAL PRIMARY KEY,
    permission_id INTEGER NOT NULL,
    end_user_id   BIGINT NOT NULL REFERENCES eSparkTalentAPI_end_user(id) ON DELETE CASCADE,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE eSparkTalentAPI_end_user_groups
(
    id            SERIAL PRIMARY KEY,
    group_id      INTEGER NOT NULL,
    end_user_id   BIGINT NOT NULL REFERENCES eSparkTalentAPI_end_user(id) ON DELETE CASCADE,
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE eSparkTalentAPI_punch_request
(
    id            SERIAL PRIMARY KEY,
    client_id    BIGINT NOT NULL REFERENCES eSparkTalentAPI_client(id) ON DELETE CASCADE,
    employee_id   BIGINT NOT NULL REFERENCES eSparkTalentAPI_employee(id) ON DELETE CASCADE,
    punch_type    VARCHAR(10) NOT NULL CHECK (punch_type IN ('check_in', 'check_out')),
    punch_time    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date          DATE NOT NULL,
    description   VARCHAR(255) NOT NULL,
    status        VARCHAR(255) NOT NULL CHECK (status IN ('pending', 'completed', 'rejected')),
    created_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE eSparkTalentAPI_outsource_employees 
(
    id SERIAL PRIMARY KEY,
    client_id BIGINT NOT NULL REFERENCES eSparkTalentAPI_client(id) ON DELETE CASCADE,
    employee_id BIGINT NOT NULL REFERENCES eSparkTalentAPI_employee(id) ON DELETE CASCADE,
    country VARCHAR(255) NOT NULL,
    role_type VARCHAR(255) NOT NULL,
    employment_term VARCHAR(255) NOT NULL,
    joining_date DATE NOT NULL,
    salary INTEGER NOT NULL,
    status VARCHAR(255) NOT NULL DEFAULT 'active',
    job_title VARCHAR(255) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- CREATING INDEXING ON ALL TABLES

-- POLICY TABLE
CREATE INDEX idx_eSparkTalentAPI_policy_policy_name ON eSparkTalentAPI_policy (policy_name);
CREATE INDEX idx_eSparkTalentAPI_policy_policy_doc ON eSparkTalentAPI_policy (policy_doc);
CREATE INDEX idx_eSparkTalentAPI_policy_employee ON eSparkTalentAPI_policy (employee);
CREATE INDEX idx_eSparkTalentAPI_policy_client ON eSparkTalentAPI_policy (client);
CREATE INDEX idx_eSparkTalentAPI_policy_description ON eSparkTalentAPI_policy (description);

-- LETTER TABLE
CREATE INDEX idx_eSparkTalentAPI_letter_email ON eSparkTalentAPI_letter (email);
CREATE INDEX idx_eSparkTalentAPI_letter_issue_date ON eSparkTalentAPI_letter (issue_date);
CREATE INDEX idx_eSparkTalentAPI_letter_objective ON eSparkTalentAPI_letter (objective);
CREATE INDEX idx_eSparkTalentAPI_letter_letter ON eSparkTalentAPI_letter (letter);

-- END USER TABLE
CREATE INDEX idx_eSparkTalentAPI_end_user_email ON eSparkTalentAPI_end_user (email);

-- GUIDE TABLE
CREATE INDEX idx_eSparkTalentAPI_guide_guide_name ON eSparkTalentAPI_guide (guide_name);
CREATE INDEX idx_eSparkTalentAPI_guide_language ON eSparkTalentAPI_guide (language);

-- NOTIFICATIONS TABLE
CREATE INDEX idx_eSparkTalentAPI_notifications_email ON eSparkTalentAPI_notifications (email);

-- CLIENT TABLE
CREATE INDEX idx_eSparkTalentAPI_client_company_name ON eSparkTalentAPI_client (company_name);
CREATE INDEX idx_eSparkTalentAPI_client_email ON eSparkTalentAPI_client (email);

-- COMPANY DATA TABLE
CREATE INDEX idx_eSparkTalentAPI_company_data_company_name ON eSparkTalentAPI_company_data (company_name);

-- EMPLOYEE TABLE
CREATE INDEX idx_eSparkTalentAPI_employee_first_name ON eSparkTalentAPI_employee (first_name);
CREATE INDEX idx_eSparkTalentAPI_employee_last_name ON eSparkTalentAPI_employee (last_name);
CREATE INDEX idx_eSparkTalentAPI_employee_email ON eSparkTalentAPI_employee (email);

-- CLIENT CONTRACT TABLE
CREATE INDEX idx_eSparkTalentAPI_client_contract_contract_name ON eSparkTalentAPI_client_contract (contract_name);

-- EMPLOYEE CONTRACT TABLE
CREATE INDEX idx_eSparkTalentAPI_employee_contract_employee_id ON eSparkTalentAPI_employee_contract (employee_id);

-- TIME SHEET TABLE
CREATE INDEX idx_eSparkTalentAPI_time_sheet_client_id ON eSparkTalentAPI_time_sheet (client_id);
CREATE INDEX idx_eSparkTalentAPI_time_sheet_employee_id ON eSparkTalentAPI_time_sheet (employee_id);

-- HIRING REQUEST TABLE
CREATE INDEX idx_eSparkTalentAPI_hiring_request_client_id ON eSparkTalentAPI_hiring_request (client_id);

-- ASSET TABLE
CREATE INDEX idx_eSparkTalentAPI_asset_employee_id ON eSparkTalentAPI_asset (employee_id);

-- LEAVE BALANCE TABLE
CREATE INDEX idx_eSparkTalentAPI_leave_balance_employee_id ON eSparkTalentAPI_leave_balance (employee_id);

-- LEAVE REQUEST TABLE
CREATE INDEX idx_eSparkTalentAPI_leave_request_client_id ON eSparkTalentAPI_leave_request (client_id);
CREATE INDEX idx_eSparkTalentAPI_leave_request_employee_id ON eSparkTalentAPI_leave_request (employee_id);

-- INTERVIEW SCHEDULE TABLE
CREATE INDEX idx_eSparkTalentAPI_interview_schedule_client_id ON eSparkTalentAPI_interview_schedule (client_id);

-- ACCOUNT AND PERMISSIONS TABLE
CREATE INDEX idx_eSparkTalentAPI_account_n_persmission_email ON eSparkTalentAPI_account_n_persmission (email);

-- OFFSHORE CONTRACTS TABLE
CREATE INDEX idx_eSparkTalentAPI_offshore_contracts_client_id ON eSparkTalentAPI_offshore_contracts (client_id);

-- BENEFITS TABLE
CREATE INDEX idx_eSparkTalentAPI_benefits_employee_id ON eSparkTalentAPI_benefits (employee_id);

-- OTHER PAYMENT TABLE
CREATE INDEX idx_eSparkTalentAPI_other_payment_client_id ON eSparkTalentAPI_other_payment (client_id);

-- EMPLOYEE INVOICE TABLE
CREATE INDEX idx_eSparkTalentAPI_employee_invoice_client_id ON eSparkTalentAPI_employee_invoice (client_id);

-- SALARY TABLE
CREATE INDEX idx_eSparkTalentAPI_salary_employee_id ON eSparkTalentAPI_salary (employee_id);

-- ONBOARDING TABLE
CREATE INDEX idx_eSparkTalentAPI_onboarding_client_id ON eSparkTalentAPI_onboarding (client_id);

-- END USER USER PERMISSIONS TABLE
CREATE INDEX idx_eSparkTalentAPI_end_user_user_permissions_end_user_id ON eSparkTalentAPI_end_user_user_permissions (end_user_id);

-- END USER GROUPS TABLE
CREATE INDEX idx_eSparkTalentAPI_end_user_groups_end_user_id ON eSparkTalentAPI_end_user_groups (end_user_id);

-- PUNCH REQUEST TABLE
CREATE INDEX idx_eSparkTalentAPI_punch_request_client_id ON eSparkTalentAPI_punch_request (client_id);

-- OUTSOURCE EMPLOYEES TABLE
CREATE INDEX idx_eSparkTalentAPI_outsource_employees_client_id ON eSparkTalentAPI_outsource_employees (client_id);



-- UPDATING THE UPDATED_AT COLUMN
CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS
$$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';


-- TRIGGERING THE UPDATE_UPDATED_AT_COLUMN FUNCTION


-- POLICY TABLE
CREATE TRIGGER update_eSparkTalentAPI_policy_updated_at
    BEFORE UPDATE
    ON eSparkTalentAPI_policy
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- LETTER TABLE
CREATE TRIGGER update_eSparkTalentAPI_letter_updated_at
    BEFORE UPDATE
    ON eSparkTalentAPI_letter
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- END USER TABLE
CREATE TRIGGER update_eSparkTalentAPI_end_user_updated_at
    BEFORE UPDATE
    ON eSparkTalentAPI_end_user
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- GUIDE TABLE
CREATE TRIGGER update_eSparkTalentAPI_guide_updated_at
    BEFORE UPDATE
    ON eSparkTalentAPI_guide
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- NOTIFICATIONS TABLE
CREATE TRIGGER update_eSparkTalentAPI_notifications_updated_at
    BEFORE UPDATE
    ON eSparkTalentAPI_notifications
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- CLIENT TABLE
CREATE TRIGGER update_eSparkTalentAPI_client_updated_at
    BEFORE UPDATE
    ON eSparkTalentAPI_client
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- COMPANY DATA TABLE
CREATE TRIGGER update_eSparkTalentAPI_company_data_updated_at
    BEFORE UPDATE
    ON eSparkTalentAPI_company_data
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- EMPLOYEE TABLE
CREATE TRIGGER update_eSparkTalentAPI_employee_updated_at
    BEFORE UPDATE
    ON eSparkTalentAPI_employee 
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- CLIENT CONTRACT TABLE
CREATE TRIGGER update_eSparkTalentAPI_client_contract_updated_at
    BEFORE UPDATE
    ON eSparkTalentAPI_client_contract
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- EMPLOYEE CONTRACT TABLE
CREATE TRIGGER update_eSparkTalentAPI_employee_contract_updated_at
    BEFORE UPDATE
    ON eSparkTalentAPI_employee_contract
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- TIME SHEET TABLE
CREATE TRIGGER update_eSparkTalentAPI_time_sheet_updated_at
    BEFORE UPDATE
    ON eSparkTalentAPI_time_sheet
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- HIRING REQUEST TABLE
CREATE TRIGGER update_eSparkTalentAPI_hiring_request_updated_at
    BEFORE UPDATE
    ON eSparkTalentAPI_hiring_request
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ASSET TABLE
CREATE TRIGGER update_eSparkTalentAPI_asset_updated_at
    BEFORE UPDATE
    ON eSparkTalentAPI_asset
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- LEAVE BALANCE TABLE
CREATE TRIGGER update_eSparkTalentAPI_leave_balance_updated_at
    BEFORE UPDATE
    ON eSparkTalentAPI_leave_balance
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- LEAVE REQUEST TABLE
CREATE TRIGGER update_eSparkTalentAPI_leave_request_updated_at
    BEFORE UPDATE
    ON eSparkTalentAPI_leave_request
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- INTERVIEW SCHEDULE TABLE
CREATE TRIGGER update_eSparkTalentAPI_interview_schedule_updated_at
    BEFORE UPDATE
    ON eSparkTalentAPI_interview_schedule
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ACCOUNT AND PERMISSIONS TABLE
CREATE TRIGGER update_eSparkTalentAPI_account_n_persmission_updated_at
    BEFORE UPDATE
    ON eSparkTalentAPI_account_n_persmission
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- OFFSHORE CONTRACTS TABLE
CREATE TRIGGER update_eSparkTalentAPI_offshore_contracts_updated_at
    BEFORE UPDATE
    ON eSparkTalentAPI_offshore_contracts
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- BENEFITS TABLE
CREATE TRIGGER update_eSparkTalentAPI_benefits_updated_at
    BEFORE UPDATE
    ON eSparkTalentAPI_benefits
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- OTHER PAYMENT TABLE
CREATE TRIGGER update_eSparkTalentAPI_other_payment_updated_at
    BEFORE UPDATE
    ON eSparkTalentAPI_other_payment
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- EMPLOYEE INVOICE TABLE
CREATE TRIGGER update_eSparkTalentAPI_employee_invoice_updated_at
    BEFORE UPDATE
    ON eSparkTalentAPI_employee_invoice
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- SALARY TABLE
CREATE TRIGGER update_eSparkTalentAPI_salary_updated_at
    BEFORE UPDATE
    ON eSparkTalentAPI_salary
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ONBOARDING TABLE
CREATE TRIGGER update_eSparkTalentAPI_onboarding_updated_at
    BEFORE UPDATE
    ON eSparkTalentAPI_onboarding
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- END USER USER PERMISSIONS TABLE
CREATE TRIGGER update_eSparkTalentAPI_end_user_user_permissions_updated_at
    BEFORE UPDATE
    ON eSparkTalentAPI_end_user_user_permissions
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- END USER GROUPS TABLE
CREATE TRIGGER update_eSparkTalentAPI_end_user_groups_updated_at
    BEFORE UPDATE
    ON eSparkTalentAPI_end_user_groups
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- PUNCH REQUEST TABLE
CREATE TRIGGER update_eSparkTalentAPI_punch_request_updated_at
    BEFORE UPDATE
    ON eSparkTalentAPI_punch_request
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- OUTSOURCE EMPLOYEES TABLE
CREATE TRIGGER update_eSparkTalentAPI_outsource_employees_updated_at
    BEFORE UPDATE
    ON eSparkTalentAPI_outsource_employees
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

