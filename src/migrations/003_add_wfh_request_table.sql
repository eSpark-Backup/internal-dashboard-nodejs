CREATE TABLE eSparkTalentAPI_wfh_request (
    id           SERIAL PRIMARY KEY,
    employee_id  BIGINT NOT NULL REFERENCES eSparkTalentAPI_employee(id) ON DELETE CASCADE,
    start_date   DATE NOT NULL,
    end_date     DATE NOT NULL,
    count        INTEGER NOT NULL,
    reason       VARCHAR(255) NOT NULL,
    status       VARCHAR(255) NOT NULL CHECK (status IN ('pending', 'completed', 'rejected')),
    created_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_eSparkTalentAPI_wfh_request_updated_at
    BEFORE UPDATE
    ON eSparkTalentAPI_wfh_request
    FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_eSparkTalentAPI_wfh_request_employee_id ON eSparkTalentAPI_wfh_request (employee_id);
