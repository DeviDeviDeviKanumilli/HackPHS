-- Update existing TradeRequest records to use valid enum values
-- Convert "accepted" and "declined" to "cancelled" since we removed those from the enum

UPDATE trade_requests 
SET status = 'cancelled' 
WHERE status IN ('accepted', 'declined');

