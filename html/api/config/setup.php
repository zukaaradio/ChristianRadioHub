<?php
// Include database connection
require_once 'Database.php';

// Create database connection
$database = new Database();
$conn = $database->connect();

// Set up users table
$users_sql = "CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    fullName VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";

// Set up streams table
$streams_sql = "CREATE TABLE IF NOT EXISTS streams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    streamUrl VARCHAR(255) NOT NULL,
    description TEXT,
    isActive BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";

// Set up shows table
$shows_sql = "CREATE TABLE IF NOT EXISTS shows (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    host VARCHAR(255),
    coverImage VARCHAR(255),
    isRecorded BOOLEAN DEFAULT 0,
    audioFile VARCHAR(255),
    autoRotation BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";

// Set up schedules table
$schedules_sql = "CREATE TABLE IF NOT EXISTS schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    showId INT,
    startTime DATETIME NOT NULL,
    endTime DATETIME NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled',
    isRecurring BOOLEAN DEFAULT 0,
    recurringDays VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (showId) REFERENCES shows(id) ON DELETE CASCADE
)";

// Set up listener_stats table
$listener_stats_sql = "CREATE TABLE IF NOT EXISTS listener_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    streamId INT,
    showId INT,
    count INT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    ipAddress VARCHAR(45),
    FOREIGN KEY (streamId) REFERENCES streams(id) ON DELETE SET NULL,
    FOREIGN KEY (showId) REFERENCES shows(id) ON DELETE SET NULL
)";

// Set up media_uploads table
$media_uploads_sql = "CREATE TABLE IF NOT EXISTS media_uploads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    fileType VARCHAR(50) NOT NULL,
    filePath VARCHAR(255) NOT NULL,
    fileSize INT NOT NULL,
    uploadedBy INT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploadedBy) REFERENCES users(id) ON DELETE SET NULL
)";

// Set up analytics table
$analytics_sql = "CREATE TABLE IF NOT EXISTS analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    totalListeners INT DEFAULT 0,
    peakListeners INT DEFAULT 0,
    avgListenTime INT DEFAULT 0,
    date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";

// Set up voice_announcements table
$voice_announcements_sql = "CREATE TABLE IF NOT EXISTS voice_announcements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    scriptText TEXT NOT NULL,
    audioPath VARCHAR(255) NOT NULL,
    createdBy INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL
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
    
    echo "Database tables created successfully.<br>";
    
    // Check if admin user exists
    $stmt = $conn->prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
    $stmt->execute();
    $row = $stmt->fetch();
    
    // Create default admin user if none exists
    if($row['count'] == 0) {
        $admin_password = password_hash('admin123', PASSWORD_DEFAULT);
        $admin_sql = "INSERT INTO users (username, password, fullName, role) 
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
        $stream_sql = "INSERT INTO streams (title, streamUrl, description, isActive) 
                      VALUES ('Grace Waves Christian Radio', 'https://radio.brentwooddrivesda.org/listen/bwd_radio/radio.mp3', 
                              'Our main radio stream with Christian music and programming', 1)";
        $conn->exec($stream_sql);
        echo "Default radio stream created.<br>";
    }
    
    echo "<br>Setup complete! <a href='../../admin/login.html'>Go to admin login</a>";
    
} catch(PDOException $e) {
    echo "Error creating tables: " . $e->getMessage();
}
?>