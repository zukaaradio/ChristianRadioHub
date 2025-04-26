<?php
require_once '../config/Database.php';

class Show {
    private $conn;
    private $table = 'shows';
    
    // Show properties
    public $id;
    public $title;
    public $description;
    public $host;
    public $coverImage;
    public $isRecorded;
    public $audioFile;
    public $autoRotation;
    public $created_at;
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->connect();
    }
    
    // Get all shows
    public function read() {
        $query = 'SELECT 
                    id, 
                    title, 
                    description,
                    host,
                    coverImage,
                    isRecorded,
                    audioFile,
                    autoRotation,
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
                    coverImage,
                    isRecorded,
                    audioFile,
                    autoRotation,
                    created_at
                  FROM 
                    ' . $this->table . '
                  WHERE 
                    id = :id
                  LIMIT 0,1';
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id);
        $stmt->execute();
        
        $row = $stmt->fetch();
        
        if($row) {
            $this->id = $row['id'];
            $this->title = $row['title'];
            $this->description = $row['description'];
            $this->host = $row['host'];
            $this->coverImage = $row['coverImage'];
            $this->isRecorded = $row['isRecorded'];
            $this->audioFile = $row['audioFile'];
            $this->autoRotation = $row['autoRotation'];
            $this->created_at = $row['created_at'];
            return true;
        }
        
        return false;
    }
    
    // Create a show
    public function create() {
        $query = 'INSERT INTO ' . $this->table . '
                  SET
                    title = :title,
                    description = :description,
                    host = :host,
                    coverImage = :coverImage,
                    isRecorded = :isRecorded,
                    audioFile = :audioFile,
                    autoRotation = :autoRotation';
        
        $stmt = $this->conn->prepare($query);
        
        // Clean data
        $this->title = htmlspecialchars(strip_tags($this->title));
        $this->description = htmlspecialchars(strip_tags($this->description));
        $this->host = htmlspecialchars(strip_tags($this->host));
        $this->coverImage = htmlspecialchars(strip_tags($this->coverImage));
        $this->audioFile = htmlspecialchars(strip_tags($this->audioFile));
        
        // Bind data
        $stmt->bindParam(':title', $this->title);
        $stmt->bindParam(':description', $this->description);
        $stmt->bindParam(':host', $this->host);
        $stmt->bindParam(':coverImage', $this->coverImage);
        $stmt->bindParam(':isRecorded', $this->isRecorded, PDO::PARAM_BOOL);
        $stmt->bindParam(':audioFile', $this->audioFile);
        $stmt->bindParam(':autoRotation', $this->autoRotation, PDO::PARAM_BOOL);
        
        // Execute query
        if($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
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
                    coverImage = :coverImage,
                    isRecorded = :isRecorded,
                    audioFile = :audioFile,
                    autoRotation = :autoRotation
                  WHERE
                    id = :id';
        
        $stmt = $this->conn->prepare($query);
        
        // Clean data
        $this->title = htmlspecialchars(strip_tags($this->title));
        $this->description = htmlspecialchars(strip_tags($this->description));
        $this->host = htmlspecialchars(strip_tags($this->host));
        $this->coverImage = htmlspecialchars(strip_tags($this->coverImage));
        $this->audioFile = htmlspecialchars(strip_tags($this->audioFile));
        $this->id = htmlspecialchars(strip_tags($this->id));
        
        // Bind data
        $stmt->bindParam(':title', $this->title);
        $stmt->bindParam(':description', $this->description);
        $stmt->bindParam(':host', $this->host);
        $stmt->bindParam(':coverImage', $this->coverImage);
        $stmt->bindParam(':isRecorded', $this->isRecorded, PDO::PARAM_BOOL);
        $stmt->bindParam(':audioFile', $this->audioFile);
        $stmt->bindParam(':autoRotation', $this->autoRotation, PDO::PARAM_BOOL);
        $stmt->bindParam(':id', $this->id);
        
        // Execute query
        if($stmt->execute()) {
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