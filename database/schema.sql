PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  mobile TEXT NOT NULL UNIQUE,
  email TEXT UNIQUE,
  kyc_status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_security (
  user_id INTEGER PRIMARY KEY,
  pin_hash TEXT,
  pin_set_at TEXT,
  failed_pin_attempts INTEGER NOT NULL DEFAULT 0,
  last_failed_pin_at TEXT,
  mfa_biometric_enabled INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE jwt_sessions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  device_info TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE otp_sessions (
  id TEXT PRIMARY KEY,
  mobile TEXT NOT NULL,
  otp_hash TEXT NOT NULL,
  purpose TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  expires_at TEXT NOT NULL,
  verified_at TEXT
);

CREATE TABLE bank_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  bank_name TEXT NOT NULL,
  ifsc TEXT NOT NULL,
  account_number TEXT NOT NULL,
  holder_name TEXT NOT NULL,
  is_verified INTEGER NOT NULL DEFAULT 0,
  is_primary INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, account_number, ifsc),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE bank_account_balances (
  bank_account_id INTEGER PRIMARY KEY,
  available_amount INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id) ON DELETE CASCADE
);

CREATE TABLE upi_ids (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  upi TEXT NOT NULL,
  bank_account_id INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (upi),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (bank_account_id) REFERENCES bank_accounts(id) ON DELETE CASCADE
);

CREATE TABLE contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  upi_id TEXT,
  mobile TEXT,
  verified INTEGER NOT NULL DEFAULT 0,
  last_interacted_at TEXT,
  UNIQUE (user_id, upi_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE merchants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  name TEXT NOT NULL,
  upi_collect_id TEXT UNIQUE,
  qr_static_data TEXT,
  settlement_bank_account_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (settlement_bank_account_id) REFERENCES bank_accounts(id)
);

CREATE TABLE wallet_accounts (
  user_id INTEGER PRIMARY KEY,
  balance INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE wallet_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  txn_id TEXT NOT NULL,
  entry_type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (txn_id, entry_type),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE billers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  state TEXT,
  biller_code TEXT NOT NULL UNIQUE,
  parameters_json TEXT NOT NULL,
  logo TEXT
);

CREATE TABLE bill_payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  biller_id INTEGER NOT NULL,
  bill_reference TEXT,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL,
  autopay_enabled INTEGER NOT NULL DEFAULT 0,
  metadata_json TEXT,
  txn_id TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (biller_id) REFERENCES billers(id)
);

CREATE TABLE recharge_operators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE recharge_plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  operator_id INTEGER NOT NULL,
  circle TEXT NOT NULL,
  plan_type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  validity TEXT,
  data TEXT,
  voice TEXT,
  sms TEXT,
  description TEXT,
  FOREIGN KEY (operator_id) REFERENCES recharge_operators(id)
);

CREATE TABLE mobile_recharges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  mobile TEXT NOT NULL,
  operator_id INTEGER NOT NULL,
  circle TEXT NOT NULL,
  plan_id INTEGER,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL,
  txn_id TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (operator_id) REFERENCES recharge_operators(id),
  FOREIGN KEY (plan_id) REFERENCES recharge_plans(id)
);

CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  counterparty_user_id INTEGER,
  counterparty_upi TEXT,
  type TEXT NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL,
  description TEXT,
  reference TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  closing_balance INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE transaction_limits (
  user_id INTEGER PRIMARY KEY,
  per_txn_limit INTEGER NOT NULL,
  daily_limit INTEGER NOT NULL,
  monthly_limit INTEGER NOT NULL,
  used_today INTEGER NOT NULL DEFAULT 0,
  used_month INTEGER NOT NULL DEFAULT 0,
  window_day TEXT,
  window_month TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE cashback_credits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  txn_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  credited_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (txn_id) REFERENCES transactions(id)
);

CREATE TABLE reward_points (
  user_id INTEGER PRIMARY KEY,
  points INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE disputes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  txn_id TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (txn_id) REFERENCES transactions(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE idempotency_keys (
  id TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL,
  endpoint TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  txn_id TEXT,
  response_json TEXT,
  status_code INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, endpoint, id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  entity TEXT,
  entity_id TEXT,
  meta_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE VIEW v_user_primary_bank AS
SELECT b.* FROM bank_accounts b
JOIN (SELECT user_id, MAX(is_primary) AS is_primary FROM bank_accounts GROUP BY user_id) m
ON m.user_id = b.user_id AND b.is_primary = 1;

CREATE TRIGGER trg_bank_primary_single
AFTER UPDATE OF is_primary ON bank_accounts
FOR EACH ROW
WHEN NEW.is_primary = 1
BEGIN
  UPDATE bank_accounts SET is_primary = 0 WHERE user_id = NEW.user_id AND id <> NEW.id;
END;

CREATE TRIGGER trg_wallet_no_negative
BEFORE UPDATE ON wallet_accounts
WHEN NEW.balance < 0
BEGIN
  SELECT RAISE(ABORT, 'Insufficient wallet balance');
END;
