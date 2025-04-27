<?php
require_once '../config/PostgresDatabase.php';

class PostgresShow {
    private $conn;
    private $table = 'shows';
    
    // Show properties
    public $id;
    public $title;
    public $description;
    public $host;
    public $cover_image;
    public $is_recorded;
    public $audio_file;
    public $auto_rotation;
    public $created_at;
    
    public function __construct() {
        $database = new PostgresDatabase();
        $this->conn = $database->connect();
    }
    
    // Get all shows
    public function read() {
        $query = 'SELECT 
                    id, 
                    title, 
                    description,
                    host,
                    cover_image,
                    is_recorded,
                    audio_file,
                    auto_rotation,
                    created_at
                  FROM 
                    ' . $this->table . '
                  ORDER BY
                    title ASC';
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt;
    }
    
    // Get a show by ID
    public function read_single() {
        $query = 'SELECT 
                    id, 
                    title, 
                    description,
                    host,
                    cover_image,
                    is_recorded,
                    audio_file,
                    auto_rotation,
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
            $this->description = $row['description'];
            $this->host = $row['host'];
            $this->cover_image = $row['cover_image'];
            $this->is_recorded = $row['is_recorded'];
            $this->audio_file = $row['audio_file'];
            $this->auto_rotation = $row['auto_rotation'];
            $this->created_at = $row['created_at'];
            return true;
        }
        
        return false;
    }
    
    // Create a show
    public function create() {
        $query = 'INSERT INTO ' . $this->table . '
                  (title, description, host, cover_image, is_recorded, audio_file, auto_rotation)
                  VALUES (:title, :description, :host, :cover_image, :is_recorded, :audio_file, :auto_rotation)
                  RETURNING id, created_at';
        
        $stmt = $this->conn->prepare($query);
        
        // Clean data
        $this->title = htmlspecialchars(strip_tags($this->title));
        $this->description = htmlspecialchars(strip_tags($this->description));
        $this->host = htmlspecialchars(strip_tags($this->host));
        $this->cover_image = htmlspecialchars(strip_tags($this->cover_image));
        $this->audio_file = htmlspecialchars(strip_tags($this->audio_file));
        
        // Bind data
        $stmt->bindParam(':title', $this->title);
        $stmt->bindParam(':description', $this->description);
        $stmt->bindParam(':host', $this->host);
        $stmt->bindParam(':cover_image', $this->cover_image);
        $stmt->bindParam(':is_recorded', $this->is_recorded, PDO::PARAM_BOOL);
        $stmt->bindParam(':audio_file', $this->audio_file);
        $stmt->bindParam(':auto_rotation', $this->auto_rotation, PDO::PARAM_BOOL);
        
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
    
    // Update a show
    public function update() {
        $query = 'UPDATE ' . $this->table . '
                  SET
                    title = :title,
                    description = :description,
                    host = :host,
                    cover_image = :cover_image,
                    is_recorded = :is_recorded,
                    audio_file = :audio_file,
                    auto_rotation = :auto_rotation
                  WHERE
                    id = :id
                  RETURNING created_at';
        
        $stmt = $this->conn->prepare($query);
        
        // Clean data
        $this->title = htmlspecialchars(strip_tags($this->title));
        $this->description = htmlspecialchars(strip_tags($this->description));
        $this->host = htmlspecialchars(strip_tags($this->host));
        $this->cover_image = htmlspecialchars(strip_tags($this->cover_image));
        $this->audio_file = htmlspecialchars(strip_tags($this->audio_file));
        $this->id = htmlspecialchars(strip_tags($this->id));
        
        // Bind data
        $stmt->bindParam(':title', $this->title);
        $stmt->bindParam(':description', $this->description);
        $stmt->bindParam(':host', $this->host);
        $stmt->bindParam(':cover_image', $this->cover_image);
        $stmt->bindParam(':is_recorded', $this->is_recorded, PDO::PARAM_BOOL);
        $stmt->bindParam(':audio_file', $this->audio_file);
        $stmt->bindParam(':auto_rotation', $this->auto_rotation, PDO::PARAM_BOOL);
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
    
    // Delete a show
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
}
?>