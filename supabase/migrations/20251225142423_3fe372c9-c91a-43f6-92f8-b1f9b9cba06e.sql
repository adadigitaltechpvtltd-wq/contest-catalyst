-- Insert missing wallet transaction for the existing winner
INSERT INTO wallet_transactions (user_id, contest_id, submission_id, type, amount, currency, status, notes)
SELECT 
  c.winner_id,
  c.id,
  c.winning_submission_id,
  'prize',
  c.prize_amount,
  c.prize_currency,
  'pending',
  'Prize for winning "' || c.title || '"'
FROM contests c
WHERE c.winner_id IS NOT NULL
  AND c.winning_submission_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM wallet_transactions wt 
    WHERE wt.contest_id = c.id 
    AND wt.submission_id = c.winning_submission_id 
    AND wt.type = 'prize'
  );