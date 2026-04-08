-- Add salary_currency column to outsource employees table
ALTER TABLE eSparkTalentAPI_outsource_employees 
ADD COLUMN salary_currency VARCHAR(255) NOT NULL DEFAULT 'PKR';

-- Update index for performance
CREATE INDEX idx_eSparkTalentAPI_outsource_employees_currency 
ON eSparkTalentAPI_outsource_employees (salary_currency);