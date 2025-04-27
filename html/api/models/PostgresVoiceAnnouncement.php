<?php
require_once '../config/PostgresDatabase.php';

class PostgresVoiceAnnouncement {
    private $conn;
    private $table = 'voice_announcements';
    
    // Voice announcement properties
    public $id;
    public $type;
    public $script_text;
    public $audio_path;
    public $created_by;
    public $created_at;
    
    // Additional properties from joins
    public $creator_name;
    
    public function __construct() {
        $database = new PostgresDatabase();
        $this->conn = $database->connect();
    }
    
    // Get all voice announcements
    public function read() {
        $query = 'SELECT 
                    v.id, 
                    v.type, 
                    v.script_text,
                    v.audio_path,
                    v.created_by,
                    v.created_at,
                    u.full_name as creator_name
                  FROM 
                    ' . $this->table . ' v
                  LEFT JOIN
                    users u ON v.created_by = u.id
                  ORDER BY
                    v.created_at DESC';
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt;
    }
    
    // Get announcements by type
    public function read_by_type() {
        $query = 'SELECT 
                    v.id, 
                    v.type, 
                    v.script_text,
                    v.audio_path,
                    v.created_by,
                    v.created_at,
                    u.full_name as creator_name
                  FROM 
                    ' . $this->table . ' v
                  LEFT JOIN
                    users u ON v.created_by = u.id
                  WHERE
                    v.type = :type
                  ORDER BY
                    v.created_at DESC';
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':type', $this->type);
        $stmt->execute();
        
        return $stmt;
    }
    
    // Get a voice announcement by ID
    public function read_single() {
        $query = 'SELECT 
                    v.id, 
                    v.type, 
                    v.script_text,
                    v.audio_path,
                    v.created_by,
                    v.created_at,
                    u.full_name as creator_name
                  FROM 
                    ' . $this->table . ' v
                  LEFT JOIN
                    users u ON v.created_by = u.id
                  WHERE 
                    v.id = :id
                  LIMIT 1';
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id);
        $stmt->execute();
        
        $row = $stmt->fetch();
        
        if($row) {
            $this->id = $row['id'];
            $this->type = $row['type'];
            $this->script_text = $row['script_text'];
            $this->audio_path = $row['audio_path'];
            $this->created_by = $row['created_by'];
            $this->created_at = $row['created_at'];
            $this->creator_name = $row['creator_name'];
            return true;
        }
        
        return false;
    }
    
    // Create a voice announcement
    public function create() {
        $query = 'INSERT INTO ' . $this->table . '
                  (type, script_text, audio_path, created_by)
                  VALUES (:type, :script_text, :audio_path, :created_by)
                  RETURNING id, created_at';
        
        $stmt = $this->conn->prepare($query);
        
        // Clean data
        $this->type = htmlspecialchars(strip_tags($this->type));
        $this->script_text = htmlspecialchars(strip_tags($this->script_text));
        $this->audio_path = htmlspecialchars(strip_tags($this->audio_path));
        
        // Bind data
        $stmt->bindParam(':type', $this->type);
        $stmt->bindParam(':script_text', $this->script_text);
        $stmt->bindParam(':audio_path', $this->audio_path);
        $stmt->bindParam(':created_by', $this->created_by);
        
        // Execute query
        if($stmt->execute()) {
            $row = $stmt->fetch();
            $this->id = $row['id'];
            $this->created_at = $row['created_at'];
            return true;
        }
        
        printf("Error: %s.\n", $stmt->error);
        
        return false;
    }
    
    // Update a voice announcement
    public function update() {
        $query = 'UPDATE ' . $this->table . '
                  SET
                    type = :type,
                    script_text = :script_text,
                    audio_path = :audio_path
                  WHERE
                    id = :id
                  RETURNING created_at';
        
        $stmt = $this->conn->prepare($query);
        
        // Clean data
        $this->type = htmlspecialchars(strip_tags($this->type));
        $this->script_text = htmlspecialchars(strip_tags($this->script_text));
        $this->audio_path = htmlspecialchars(strip_tags($this->audio_path));
        $this->id = htmlspecialchars(strip_tags($this->id));
        
        // Bind data
        $stmt->bindParam(':type', $this->type);
        $stmt->bindParam(':script_text', $this->script_text);
        $stmt->bindParam(':audio_path', $this->audio_path);
        $stmt->bindParam(':id', $this->id);
        
        // Execute query
        if($stmt->execute()) {
            $row = $stmt->fetch();
            $this->created_at = $row['created_at'];
            return true;
        }
        
        printf("Error: %s.\n", $stmt->error);
        
        return false;
    }
    
    // Delete a voice announcement
    public function delete() {
        $query = 'DELETE FROM ' . $this->table . ' WHERE id = :id';
        
        $stmt = $this->conn->prepare($query);
        
        // Clean data
        $this->id = htmlspecialchars(strip_tags($this->id));
        
        // Bind data
        $stmt->bindParam(':id', $this->id);
        
        // Execute query
        if($stmt->execute()) {
            return true;
        }
        
        printf("Error: %s.\n", $stmt->error);
        
        return false;
    }
    
    // Get latest announcements (for dashboard)
    public function read_latest($limit = 5) {
        $query = 'SELECT 
                    v.id, 
                    v.type, 
                    v.script_text,
                    v.audio_path,
                    v.created_by,
                    v.created_at,
                    u.full_name as creator_name
                  FROM 
                    ' . $this->table . ' v
                  LEFT JOIN
                    users u ON v.created_by = u.id
                  ORDER BY
                    v.created_at DESC
                  LIMIT :limit';
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt;
    }
}
?>