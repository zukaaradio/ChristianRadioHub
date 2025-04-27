<?php
require_once '../config/PostgresDatabase.php';

class PostgresStream {
    private $conn;
    private $table = 'streams';
    
    // Stream properties
    public $id;
    public $title;
    public $stream_url;
    public $description;
    public $is_active;
    public $created_at;
    
    public function __construct() {
        $database = new PostgresDatabase();
        $this->conn = $database->connect();
    }
    
    // Get all streams
    public function read() {
        $query = 'SELECT 
                    id, 
                    title, 
                    stream_url,
                    description,
                    is_active,
                    created_at
                  FROM 
                    ' . $this->table . '
                  ORDER BY
                    created_at DESC';
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt;
    }
    
    // Get a stream by ID
    public function read_single() {
        $query = 'SELECT 
                    id, 
                    title, 
                    stream_url,
                    description,
                    is_active,
                    created_at
                  FROM 
                    ' . $this->table . '
                  WHERE 
                    id = :id
                  LIMIT 1';
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id);
        $stmt->execute();
        
        $row = $stmt->fetch();
        
        if($row) {
            $this->id = $row['id'];
            $this->title = $row['title'];
            $this->stream_url = $row['stream_url'];
            $this->description = $row['description'];
            $this->is_active = $row['is_active'];
            $this->created_at = $row['created_at'];
            return true;
        }
        
        return false;
    }
    
    // Get active stream
    public function read_active() {
        $query = 'SELECT 
                    id, 
                    title, 
                    stream_url,
                    description,
                    is_active,
                    created_at
                  FROM 
                    ' . $this->table . '
                  WHERE 
                    is_active = TRUE
                  LIMIT 1';
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        $row = $stmt->fetch();
        
        if($row) {
            $this->id = $row['id'];
            $this->title = $row['title'];
            $this->stream_url = $row['stream_url'];
            $this->description = $row['description'];
            $this->is_active = $row['is_active'];
            $this->created_at = $row['created_at'];
            return true;
        }
        
        return false;
    }
    
    // Create a stream
    public function create() {
        $query = 'INSERT INTO ' . $this->table . '
                  (title, stream_url, description, is_active)
                  VALUES (:title, :stream_url, :description, :is_active)
                  RETURNING id, created_at';
        
        $stmt = $this->conn->prepare($query);
        
        // Clean data
        $this->title = htmlspecialchars(strip_tags($this->title));
        $this->stream_url = htmlspecialchars(strip_tags($this->stream_url));
        $this->description = htmlspecialchars(strip_tags($this->description));
        
        // Bind data
        $stmt->bindParam(':title', $this->title);
        $stmt->bindParam(':stream_url', $this->stream_url);
        $stmt->bindParam(':description', $this->description);
        $stmt->bindParam(':is_active', $this->is_active, PDO::PARAM_BOOL);
        
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
    
    // Update a stream
    public function update() {
        $query = 'UPDATE ' . $this->table . '
                  SET
                    title = :title,
                    stream_url = :stream_url,
                    description = :description,
                    is_active = :is_active
                  WHERE
                    id = :id
                  RETURNING created_at';
        
        $stmt = $this->conn->prepare($query);
        
        // Clean data
        $this->title = htmlspecialchars(strip_tags($this->title));
        $this->stream_url = htmlspecialchars(strip_tags($this->stream_url));
        $this->description = htmlspecialchars(strip_tags($this->description));
        $this->id = htmlspecialchars(strip_tags($this->id));
        
        // Bind data
        $stmt->bindParam(':title', $this->title);
        $stmt->bindParam(':stream_url', $this->stream_url);
        $stmt->bindParam(':description', $this->description);
        $stmt->bindParam(':is_active', $this->is_active, PDO::PARAM_BOOL);
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
    
    // Delete a stream
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
    
    // Set a stream as active (and deactivate others)
    public function set_active() {
        // First, deactivate all streams
        $query1 = 'UPDATE ' . $this->table . ' SET is_active = FALSE';
        $stmt1 = $this->conn->prepare($query1);
        $stmt1->execute();
        
        // Then, activate the specific stream
        $query2 = 'UPDATE ' . $this->table . ' SET is_active = TRUE WHERE id = :id';
        $stmt2 = $this->conn->prepare($query2);
        
        // Clean data
        $this->id = htmlspecialchars(strip_tags($this->id));
        
        // Bind data
        $stmt2->bindParam(':id', $this->id);
        
        // Execute query
        if($stmt2->execute()) {
            return true;
        }
        
        printf("Error: %s.\n", $stmt2->error);
        
        return false;
    }
}
?>