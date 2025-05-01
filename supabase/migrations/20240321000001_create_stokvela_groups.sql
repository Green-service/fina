-- Create stokvela_groups table
CREATE TABLE IF NOT EXISTS stokvela_groups (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    target_amount DECIMAL(10,2) NOT NULL,
    contribution_amount DECIMAL(10,2) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_stokvela_groups_created_by ON stokvela_groups(created_by);

-- Enable Row Level Security
ALTER TABLE stokvela_groups ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to read
CREATE POLICY "Allow authenticated users to read stokvela_groups"
    ON stokvela_groups
    FOR SELECT
    TO authenticated
    USING (true);

-- Create policy to allow only admins to modify
CREATE POLICY "Allow only admins to modify stokvela_groups"
    ON stokvela_groups
    FOR ALL
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');

-- Insert some sample data
INSERT INTO stokvela_groups (name, description, target_amount, contribution_amount, frequency, created_by)
VALUES 
    ('Monthly Savings Group', 'A group for monthly savings and investments', 10000.00, 1000.00, 'monthly', '00000000-0000-0000-0000-000000000000'),
    ('Weekly Investment Club', 'Weekly investment and savings group', 5000.00, 500.00, 'weekly', '00000000-0000-0000-0000-000000000000'); 