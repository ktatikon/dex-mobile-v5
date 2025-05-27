-- Add category column to transactions table
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other';

-- Add index on category for faster filtering
CREATE INDEX IF NOT EXISTS transactions_category_idx ON transactions(category);

-- Update existing transactions with default category based on transaction type
UPDATE transactions 
SET category = CASE 
  WHEN transaction_type = 'send' OR transaction_type = 'receive' THEN 'transfer'
  WHEN transaction_type = 'buy' OR transaction_type = 'sell' THEN 'trading'
  WHEN transaction_type = 'stake' OR transaction_type = 'unstake' THEN 'staking'
  ELSE 'other'
END
WHERE category = 'other' OR category IS NULL;
