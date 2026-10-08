-- Executed once, when the database volume is created.
-- Lets the application user manage the test database (evently_test) used by PHPUnit.
GRANT ALL PRIVILEGES ON `evently_test`.* TO 'evently'@'%';
FLUSH PRIVILEGES;
