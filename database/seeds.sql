INSERT INTO users (name, mobile, email, kyc_status) VALUES
('John Doe', '+919876543210', 'john@example.com', 'pending'),
('Anita Sharma', '+919812345678', 'anita@example.com', 'full'),
('Retail Mart', '+919900112233', 'merchant@example.com', 'full');

INSERT INTO user_security (user_id) VALUES (1), (2), (3);
INSERT INTO wallet_accounts (user_id, balance) VALUES (1, 500000), (2, 250000), (3, 0);

INSERT INTO bank_accounts (user_id, bank_name, ifsc, account_number, holder_name, is_verified, is_primary) VALUES
(1, 'HDFC Bank', 'HDFC0001234', '1234567890', 'John Doe', 1, 1),
(1, 'SBI',       'SBIN0000456', '222233334444', 'John Doe', 1, 0),
(2, 'ICICI',     'ICIC0000777', '9988776655',  'Anita Sharma', 1, 1),
(3, 'Axis',      'UTIB0000333', '5566778899',  'Retail Mart', 1, 1);

INSERT INTO bank_account_balances (bank_account_id, available_amount) VALUES
(1, 1500000),(2,300000),(3,800000),(4,5000000);

INSERT INTO upi_ids (user_id, upi, bank_account_id, status) VALUES
(1, 'john@phonepe', 1, 'active'),
(2, 'anita@paytm',  3, 'active'),
(3, 'retailmart@axis', 4, 'active');

INSERT INTO contacts (user_id, name, upi_id, mobile, verified) VALUES
(1, 'Retail Mart', 'retailmart@axis', '+919900112233', 1),
(1, 'Anita', 'anita@paytm', '+919812345678', 1);

INSERT INTO billers (name, category, state, biller_code, parameters_json, logo) VALUES
('BESCOM', 'electricity', 'Karnataka', 'BESCOM001', '["consumerNumber"]', ''),
('BWSSB', 'water', 'Karnataka', 'BWSSB001', '["rrNumber"]', ''),
('LIC', 'insurance', NULL, 'LIC001', '["policyNumber","dob"]', '');

INSERT INTO recharge_operators (name) VALUES ('Airtel'), ('Jio'), ('Vi'), ('BSNL');

INSERT INTO recharge_plans (operator_id, circle, plan_type, amount, validity, data, voice, sms, description) VALUES
(1, 'Karnataka', 'prepaid', 29900, '28 days', '1.5GB/day', 'Unlimited', '100/day', 'Combo 299'),
(2, 'Delhi', 'prepaid', 23900, '24 days', '1GB/day', 'Unlimited', '100/day', 'Combo 239');

INSERT INTO transactions (id, user_id, type, amount, status, description, reference, closing_balance, created_at) VALUES
('TXN123456789', 1, 'upi_send', 50000, 'success', 'Payment to retailmart@axis', 'RRN987654321', 450000, '2024-03-20T10:30:00Z');

INSERT INTO wallet_ledger (user_id, txn_id, entry_type, amount, balance_after, created_at) VALUES
(1, 'TXN123456789', 'debit', 50000, 450000, '2024-03-20T10:30:00Z');

INSERT INTO transaction_limits (user_id, per_txn_limit, daily_limit, monthly_limit, used_today, used_month, window_day, window_month) VALUES
(1, 1000000, 2000000, 5000000, 50000, 50000, '2024-03-20', '2024-03'),
(2, 2000000, 5000000, 10000000, 0, 0, '2024-03-20', '2024-03');

INSERT INTO reward_points (user_id, points) VALUES (1, 10), (2, 0), (3, 0);
