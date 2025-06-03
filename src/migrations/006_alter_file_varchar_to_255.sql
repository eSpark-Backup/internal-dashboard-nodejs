-- Alter eSparkTalentAPI_policy.policy_doc 
ALTER TABLE eSparkTalentAPI_policy
ALTER COLUMN policy_doc TYPE VARCHAR(255);

-- Alter eSparkTalentAPI_letter.letter 
ALTER TABLE eSparkTalentAPI_letter
ALTER COLUMN letter TYPE VARCHAR(255);

-- guide_doc in eSparkTalentAPI_guide
ALTER TABLE eSparkTalentAPI_guide
ALTER COLUMN guide_doc TYPE VARCHAR(255);

-- image in eSparkTalentAPI_client
ALTER TABLE eSparkTalentAPI_client
ALTER COLUMN image TYPE VARCHAR(255);

-- image in eSparkTalentAPI_company_data
ALTER TABLE eSparkTalentAPI_company_data
ALTER COLUMN image TYPE VARCHAR(255);

-- image and resume in eSparkTalentAPI_employee
ALTER TABLE eSparkTalentAPI_employee
ALTER COLUMN image TYPE VARCHAR(255);
ALTER TABLE eSparkTalentAPI_employee
ALTER COLUMN resume TYPE VARCHAR(255);

-- contract_doc in eSparkTalentAPI_client_contract
ALTER TABLE eSparkTalentAPI_client_contract
ALTER COLUMN contract_doc TYPE VARCHAR(255);

-- contract_doc in eSparkTalentAPI_employee_contract
ALTER TABLE eSparkTalentAPI_employee_contract
ALTER COLUMN contract_doc TYPE VARCHAR(255);

-- job_description in eSparkTalentAPI_hiring_request
ALTER TABLE eSparkTalentAPI_hiring_request
ALTER COLUMN job_description TYPE VARCHAR(255);

-- gadget in eSparkTalentAPI_asset
ALTER TABLE eSparkTalentAPI_asset
ALTER COLUMN gadget TYPE VARCHAR(255);

-- attachment in eSparkTalentAPI_leave_request
ALTER TABLE eSparkTalentAPI_leave_request
ALTER COLUMN attachment TYPE VARCHAR(255);

-- image in eSparkTalentAPI_account_n_persmission
ALTER TABLE eSparkTalentAPI_account_n_persmission
ALTER COLUMN image TYPE VARCHAR(255);

-- contract_doc in eSparkTalentAPI_offshore_contracts
ALTER TABLE eSparkTalentAPI_offshore_contracts
ALTER COLUMN contract_doc TYPE VARCHAR(255);

-- benefit in eSparkTalentAPI_benefits
ALTER TABLE eSparkTalentAPI_benefits
ALTER COLUMN benefit TYPE VARCHAR(255);

-- invoice_reference and invoice in eSparkTalentAPI_other_payment
ALTER TABLE eSparkTalentAPI_other_payment
ALTER COLUMN invoice_reference TYPE VARCHAR(255);
ALTER TABLE eSparkTalentAPI_other_payment
ALTER COLUMN invoice TYPE VARCHAR(255);

-- invoice in eSparkTalentAPI_employee_invoice
ALTER TABLE eSparkTalentAPI_employee_invoice
ALTER COLUMN invoice TYPE VARCHAR(255);

-- pay_slip in eSparkTalentAPI_salary
ALTER TABLE eSparkTalentAPI_salary
ALTER COLUMN pay_slip TYPE VARCHAR(255);
