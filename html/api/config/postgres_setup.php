<?php
// Include database connection
require_once 'PostgresDatabase.php';

// Create database connection
$database = new PostgresDatabase();
$conn = $database->connect();

// Set up users table
$users_sql = "CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";

// Set up streams table
$streams_sql = "CREATE TABLE IF NOT EXISTS streams (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    stream_url VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";

// Set up shows table
$shows_sql = "CREATE TABLE IF NOT EXISTS shows (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    host VARCHAR(255),
    cover_image VARCHAR(255),
    is_recorded BOOLEAN DEFAULT FALSE,
    audio_file VARCHAR(255),
    auto_rotation BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";

// Set up schedules table
$schedules_sql = "CREATE TABLE IF NOT EXISTS schedules (
    id SERIAL PRIMARY KEY,
    show_id INTEGER REFERENCES shows(id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',
    is_recurring BOOLEAN DEFAULT FALSE,
    recurring_days VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";

// Set up listener_stats table
$listener_stats_sql = "CREATE TABLE IF NOT EXISTS listener_stats (
    id SERIAL PRIMARY KEY,
    stream_id INTEGER REFERENCES streams(id) ON DELETE SET NULL,
    show_id INTEGER REFERENCES shows(id) ON DELETE SET NULL,
    count INTEGER NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45)
)";

// Set up media_uploads table
$media_uploads_sql = "CREATE TABLE IF NOT EXISTS media_uploads (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";

// Set up analytics table
$analytics_sql = "CREATE TABLE IF NOT EXISTS analytics (
    id SERIAL PRIMARY KEY,
    total_listeners INTEGER DEFAULT 0,
    peak_listeners INTEGER DEFAULT 0,
    avg_listen_time INTEGER DEFAULT 0,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";

// Set up voice_announcements table
$voice_announcements_sql = "CREATE TABLE IF NOT EXISTS voice_announcements (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    script_text TEXT NOT NULL,
    audio_path VARCHAR(255) NOT NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";

// Execute the SQL statements
try {
    $conn->exec($users_sql);
    $conn->exec($streams_sql);
    $conn->exec($shows_sql);
    $conn->exec($schedules_sql);
    $conn->exec($listener_stats_sql);
    $conn->exec($media_uploads_sql);
    $conn->exec($analytics_sql);
    $conn->exec($voice_announcements_sql);
    
    echo "PostgreSQL database tables created successfully.<br>";
    
    // Check if admin user exists
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
    $stmt->execute();
    $row = $stmt->fetch();
    
    // Create default admin user if none exists
    if($row['count'] == 0) {
        $admin_password = password_hash('admin123', PASSWORD_DEFAULT);
        $admin_sql = "INSERT INTO users (username, password, full_name, role) 
                      VALUES ('admin@gracewaves.org', :password, 'Administrator', 'admin')";
        $stmt = $conn->prepare($admin_sql);
        $stmt->bindParam(':password', $admin_password);
        $stmt->execute();
        echo "Default admin user created.<br>";
        echo "Username: admin@gracewaves.org<br>";
        echo "Password: admin123<br>";
        echo "<strong>Please change the password immediately after first login!</strong><br>";
    }
    
    // Create default stream if none exists
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM streams");
    $stmt->execute();
    $row = $stmt->fetch();
    
    if($row['count'] == 0) {
        $stream_sql = "INSERT INTO streams (title, stream_url, description, is_active) 
                      VALUES ('Grace Waves Christian Radio', 'https://radio.brentwooddrivesda.org/listen/bwd_radio/radio.mp3', 
                              'Our main radio stream with Christian music and programming', TRUE)";
        $conn->exec($stream_sql);
        echo "Default radio stream created.<br>";
    }
    
    echo "<br>PostgreSQL setup complete! <a href='../../admin/login.html'>Go to admin login</a>";
    
} catch(PDOException $e) {
    echo "Error creating tables: " . $e->getMessage();
}
?>