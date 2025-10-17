-- Set database timezone to Israel
-- Run this on your existing database to set the default timezone

ALTER DATABASE radio_plays SET timezone TO 'Asia/Jerusalem';

-- You may need to reconnect for this to take effect
-- Or run this in your current session:
SET timezone = 'Asia/Jerusalem';

-- Verify the timezone is set correctly:
SHOW timezone;
