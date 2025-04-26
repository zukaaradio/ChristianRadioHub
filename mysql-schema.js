/**
 * MySQL Schema Generator
 * 
 * This script generates SQL statements based on the schema defined in shared/schema.mysql.ts.
 * Run with: node mysql-schema.js > schema.sql
 */

// The following SQL statements will create the necessary tables for your MySQL database
// Copy and paste this into your own migration scripts or execute directly on your server

const mysqlSchema = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'admin'
);

-- Streams table
CREATE TABLE IF NOT EXISTS streams (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  stream_url VARCHAR(1024) NOT NULL,
  description TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE
);

-- Shows table
CREATE TABLE IF NOT EXISTS shows (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  host VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  cover_image VARCHAR(1024),
  is_recorded BOOLEAN NOT NULL DEFAULT FALSE,
  audio_file VARCHAR(1024),
  auto_rotation BOOLEAN NOT NULL DEFAULT FALSE
);

-- Schedules table
CREATE TABLE IF NOT EXISTS schedules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  show_id INT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
  recurring_days VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
  FOREIGN KEY (show_id) REFERENCES shows(id)
);

-- Listener statistics table
CREATE TABLE IF NOT EXISTS listener_stats (
  id INT AUTO_INCREMENT PRIMARY KEY,
  show_id INT,
  stream_id INT,
  timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  location VARCHAR(255),
  device VARCHAR(255),
  listen_time INT NOT NULL,
  ip_address VARCHAR(45),
  FOREIGN KEY (show_id) REFERENCES shows(id),
  FOREIGN KEY (stream_id) REFERENCES streams(id)
);

-- Media uploads table
CREATE TABLE IF NOT EXISTS media_uploads (
  id INT AUTO_INCREMENT PRIMARY KEY,
  file_name VARCHAR(255) NOT NULL,
  file_type VARCHAR(100) NOT NULL,
  file_path VARCHAR(1024) NOT NULL,
  file_size INT NOT NULL,
  upload_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  uploaded_by INT NOT NULL,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- Analytics table
CREATE TABLE IF NOT EXISTS analytics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  date DATETIME NOT NULL,
  total_listeners INT NOT NULL,
  peak_listeners INT NOT NULL,
  average_listen_time INT NOT NULL,
  top_locations JSON NOT NULL,
  top_devices JSON NOT NULL,
  top_shows JSON NOT NULL
);

-- Sessions table (for authentication)
CREATE TABLE IF NOT EXISTS sessions (
  session_id VARCHAR(128) NOT NULL,
  expires BIGINT NOT NULL,
  data TEXT,
  PRIMARY KEY (session_id)
);

-- Migrations tracking table (optional - for your migration management)
CREATE TABLE IF NOT EXISTS migrations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default data: Admin user (password: 'password')
INSERT INTO users (username, password, full_name, role)
VALUES ('admin', '$2b$10$iZ/LHDJXMwhpQOEsAKP8C.ld1JKUvM0dMUrwNu/SB4QjjULx6W1Ei', 'Admin User', 'admin')
ON DUPLICATE KEY UPDATE username = username;

-- Default stream
INSERT INTO streams (title, stream_url, description, is_active)
VALUES ('Grace Waves Christian Radio', 'https://radio.brentwooddrivesda.org/listen/bwd_radio/radio.mp3', 'Live Christian music, sermons, and inspirational programming dedicated to spreading God\'s word.', TRUE)
ON DUPLICATE KEY UPDATE title = title;
`;

console.log(mysqlSchema);