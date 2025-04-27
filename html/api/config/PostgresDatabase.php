<?php
class PostgresDatabase {
    // Database credentials
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $port;
    private $conn;
    
    public function __construct() {
        // Read from environment variables or set defaults
        $this->host = getenv('PGHOST') ?: 'localhost';
        $this->db_name = getenv('PGDATABASE') ?: 'christian_radio';
        $this->username = getenv('PGUSER') ?: 'postgres';
        $this->password = getenv('PGPASSWORD') ?: '';
        $this->port = getenv('PGPORT') ?: 5432;
    }
    
    // Connect to the database
    public function connect() {
        $this->conn = null;
        
        try {
            $dsn = "pgsql:host={$this->host};port={$this->port};dbname={$this->db_name}";
            $this->conn = new PDO($dsn, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            
            // Create tables if they don't exist
            $this->createTables();
            
        } catch(PDOException $e) {
            echo "Connection Error: " . $e->getMessage();
        }
        
        return $this->conn;
    }
    
    // Create necessary tables if they don't exist
    private function createTables() {
        // Users table
        $userTable = "CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            username VARCHAR(100) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            full_name VARCHAR(100) NOT NULL,
            role VARCHAR(50) NOT NULL DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )";
        
        // Streams table
        $streamTable = "CREATE TABLE IF NOT EXISTS streams (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            stream_url VARCHAR(255) NOT NULL,
            description TEXT,
            is_active BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )";
        
        // Shows table
        $showTable = "CREATE TABLE IF NOT EXISTS shows (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            description TEXT,
            host VARCHAR(100) NOT NULL,
            cover_image VARCHAR(255),
            is_recorded BOOLEAN DEFAULT FALSE,
            audio_file VARCHAR(255),
            auto_rotation BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )";
        
        // Schedules table
        $scheduleTable = "CREATE TABLE IF NOT EXISTS schedules (
            id SERIAL PRIMARY KEY,
            show_id INTEGER REFERENCES shows(id) ON DELETE CASCADE,
            start_time TIMESTAMP NOT NULL,
            end_time TIMESTAMP NOT NULL,
            status VARCHAR(50) DEFAULT 'scheduled',
            is_recurring BOOLEAN DEFAULT FALSE,
            recurring_days VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )";
        
        // Voice announcements table
        $announcementTable = "CREATE TABLE IF NOT EXISTS voice_announcements (
            id SERIAL PRIMARY KEY,
            type VARCHAR(50) NOT NULL,
            script_text TEXT NOT NULL,
            audio_path VARCHAR(255) NOT NULL,
            created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )";
        
        // Listener statistics table
        $listenerStatsTable = "CREATE TABLE IF NOT EXISTS listener_stats (
            id SERIAL PRIMARY KEY,
            stream_id INTEGER REFERENCES streams(id) ON DELETE CASCADE,
            show_id INTEGER REFERENCES shows(id) ON DELETE CASCADE,
            count INTEGER NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )";
        
        // Media uploads table
        $mediaUploadsTable = "CREATE TABLE IF NOT EXISTS media_uploads (
            id SERIAL PRIMARY KEY,
            title VARCHAR(255) NOT NULL,
            file_path VARCHAR(255) NOT NULL,
            file_type VARCHAR(50) NOT NULL,
            size INTEGER NOT NULL,
            uploaded_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )";
        
        // Analytics table
        $analyticsTable = "CREATE TABLE IF NOT EXISTS analytics (
            id SERIAL PRIMARY KEY,
            page_views INTEGER DEFAULT 0,
            unique_visitors INTEGER DEFAULT 0,
            stream_plays INTEGER DEFAULT 0,
            peak_listeners INTEGER DEFAULT 0,
            date DATE DEFAULT CURRENT_DATE
        )";
        
        // Likes table
        $likesTable = "CREATE TABLE IF NOT EXISTS likes (
            id SERIAL PRIMARY KEY,
            content_type VARCHAR(50) NOT NULL,
            content_id INTEGER NOT NULL,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(content_type, content_id, user_id)
        )";
        
        // Comments table
        $commentsTable = "CREATE TABLE IF NOT EXISTS comments (
            id SERIAL PRIMARY KEY,
            content_type VARCHAR(50) NOT NULL,
            content_id INTEGER NOT NULL,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            comment_text TEXT NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )";
        
        try {
            $this->conn->exec($userTable);
            $this->conn->exec($streamTable);
            $this->conn->exec($showTable);
            $this->conn->exec($scheduleTable);
            $this->conn->exec($announcementTable);
            $this->conn->exec($listenerStatsTable);
            $this->conn->exec($mediaUploadsTable);
            $this->conn->exec($analyticsTable);
            $this->conn->exec($likesTable);
            $this->conn->exec($commentsTable);
            
            // Create a default admin user if none exists
            $this->createDefaultAdmin();
            
        } catch(PDOException $e) {
            echo "Error creating tables: " . $e->getMessage();
        }
    }
    
    // Create a default admin user if none exists
    private function createDefaultAdmin() {
        $query = "SELECT COUNT(*) as count FROM users WHERE role = 'admin'";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        $result = $stmt->fetch();
        
        if($result['count'] == 0) {
            // Create a default admin (password should be changed on first login)
            $defaultPassword = password_hash('admin123', PASSWORD_DEFAULT);
            $query = "INSERT INTO users (username, password, full_name, role) VALUES ('admin', :password, 'Administrator', 'admin')";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':password', $defaultPassword);
            $stmt->execute();
        }
    }
}
?>