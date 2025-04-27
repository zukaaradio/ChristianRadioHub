<?php
require_once '../config/PostgresDatabase.php';

class PostgresLike {
    private $conn;
    private $table = 'likes';
    
    // Like properties
    public $id;
    public $content_type; // Can be 'show', 'stream', etc.
    public $content_id;
    public $user_id;
    public $created_at;
    
    // Additional properties from joins
    public $username;
    
    public function __construct() {
        $database = new PostgresDatabase();
        $this->conn = $database->connect();
    }
    
    // Get all likes for a specific content
    public function read_by_content() {
        $query = 'SELECT 
                    l.id, 
                    l.content_type, 
                    l.content_id,
                    l.user_id,
                    l.created_at,
                    u.username
                  FROM 
                    ' . $this->table . ' l
                  LEFT JOIN
                    users u ON l.user_id = u.id
                  WHERE 
                    l.content_type = :content_type AND l.content_id = :content_id
                  ORDER BY
                    l.created_at DESC';
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':content_type', $this->content_type);
        $stmt->bindParam(':content_id', $this->content_id);
        $stmt->execute();
        
        return $stmt;
    }
    
    // Get like count for a specific content
    public function count_by_content() {
        $query = 'SELECT 
                    COUNT(*) as like_count
                  FROM 
                    ' . $this->table . '
                  WHERE 
                    content_type = :content_type AND content_id = :content_id';
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':content_type', $this->content_type);
        $stmt->bindParam(':content_id', $this->content_id);
        $stmt->execute();
        
        $row = $stmt->fetch();
        return $row['like_count'];
    }
    
    // Check if a user has liked specific content
    public function has_user_liked() {
        $query = 'SELECT 
                    COUNT(*) as liked
                  FROM 
                    ' . $this->table . '
                  WHERE 
                    content_type = :content_type AND 
                    content_id = :content_id AND 
                    user_id = :user_id';
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':content_type', $this->content_type);
        $stmt->bindParam(':content_id', $this->content_id);
        $stmt->bindParam(':user_id', $this->user_id);
        $stmt->execute();
        
        $row = $stmt->fetch();
        return $row['liked'] > 0;
    }
    
    // Create a like
    public function create() {
        // First check if the user has already liked this content
        if($this->has_user_liked()) {
            return false; // Already liked
        }
        
        $query = 'INSERT INTO ' . $this->table . '
                  (content_type, content_id, user_id)
                  VALUES (:content_type, :content_id, :user_id)
                  RETURNING id, created_at';
        
        $stmt = $this->conn->prepare($query);
        
        // Clean data
        $this->content_type = htmlspecialchars(strip_tags($this->content_type));
        $this->content_id = htmlspecialchars(strip_tags($this->content_id));
        
        // Bind data
        $stmt->bindParam(':content_type', $this->content_type);
        $stmt->bindParam(':content_id', $this->content_id);
        $stmt->bindParam(':user_id', $this->user_id);
        
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
    
    // Delete a like (unlike)
    public function delete() {
        $query = 'DELETE FROM ' . $this->table . ' 
                  WHERE content_type = :content_type AND 
                        content_id = :content_id AND 
                        user_id = :user_id';
        
        $stmt = $this->conn->prepare($query);
        
        // Clean data
        $this->content_type = htmlspecialchars(strip_tags($this->content_type));
        $this->content_id = htmlspecialchars(strip_tags($this->content_id));
        
        // Bind data
        $stmt->bindParam(':content_type', $this->content_type);
        $stmt->bindParam(':content_id', $this->content_id);
        $stmt->bindParam(':user_id', $this->user_id);
        
        // Execute query
        if($stmt->execute()) {
            return true;
        }
        
        printf("Error: %s.\n", $stmt->error);
        
        return false;
    }
    
    // Get all likes by a specific user
    public function read_by_user() {
        $query = 'SELECT 
                    id, 
                    content_type, 
                    content_id,
                    user_id,
                    created_at
                  FROM 
                    ' . $this->table . '
                  WHERE 
                    user_id = :user_id
                  ORDER BY
                    created_at DESC';
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':user_id', $this->user_id);
        $stmt->execute();
        
        return $stmt;
    }
}
?>