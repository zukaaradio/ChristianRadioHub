<?php
require_once '../config/PostgresDatabase.php';

class PostgresComment {
    private $conn;
    private $table = 'comments';
    
    // Comment properties
    public $id;
    public $content_type; // Can be 'show', 'stream', etc.
    public $content_id;
    public $user_id;
    public $comment_text;
    public $status; // Could be 'pending', 'approved', 'rejected'
    public $parent_id; // For replies to comments
    public $created_at;
    
    // Additional properties from joins
    public $username;
    public $full_name;
    
    public function __construct() {
        $database = new PostgresDatabase();
        $this->conn = $database->connect();
    }
    
    // Get all comments for a specific content
    public function read_by_content() {
        $query = 'SELECT 
                    c.id, 
                    c.content_type, 
                    c.content_id,
                    c.user_id,
                    c.comment_text,
                    c.status,
                    c.parent_id,
                    c.created_at,
                    u.username,
                    u.full_name
                  FROM 
                    ' . $this->table . ' c
                  LEFT JOIN
                    users u ON c.user_id = u.id
                  WHERE 
                    c.content_type = :content_type AND 
                    c.content_id = :content_id AND
                    c.status = \'approved\'
                  ORDER BY
                    c.created_at DESC';
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':content_type', $this->content_type);
        $stmt->bindParam(':content_id', $this->content_id);
        $stmt->execute();
        
        return $stmt;
    }
    
    // Get all comments including replies for a specific content
    public function read_by_content_with_replies() {
        $query = 'SELECT 
                    c.id, 
                    c.content_type, 
                    c.content_id,
                    c.user_id,
                    c.comment_text,
                    c.status,
                    c.parent_id,
                    c.created_at,
                    u.username,
                    u.full_name
                  FROM 
                    ' . $this->table . ' c
                  LEFT JOIN
                    users u ON c.user_id = u.id
                  WHERE 
                    c.content_type = :content_type AND 
                    c.content_id = :content_id AND
                    c.status = \'approved\'
                  ORDER BY
                    c.parent_id ASC NULLS FIRST,  
                    c.created_at ASC';
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':content_type', $this->content_type);
        $stmt->bindParam(':content_id', $this->content_id);
        $stmt->execute();
        
        return $stmt;
    }
    
    // Get comment count for a specific content
    public function count_by_content() {
        $query = 'SELECT 
                    COUNT(*) as comment_count
                  FROM 
                    ' . $this->table . '
                  WHERE 
                    content_type = :content_type AND 
                    content_id = :content_id AND 
                    status = \'approved\'';
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':content_type', $this->content_type);
        $stmt->bindParam(':content_id', $this->content_id);
        $stmt->execute();
        
        $row = $stmt->fetch();
        return $row['comment_count'];
    }
    
    // Get a specific comment
    public function read_single() {
        $query = 'SELECT 
                    c.id, 
                    c.content_type, 
                    c.content_id,
                    c.user_id,
                    c.comment_text,
                    c.status,
                    c.parent_id,
                    c.created_at,
                    u.username,
                    u.full_name
                  FROM 
                    ' . $this->table . ' c
                  LEFT JOIN
                    users u ON c.user_id = u.id
                  WHERE 
                    c.id = :id
                  LIMIT 1';
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id);
        $stmt->execute();
        
        $row = $stmt->fetch();
        
        if($row) {
            $this->id = $row['id'];
            $this->content_type = $row['content_type'];
            $this->content_id = $row['content_id'];
            $this->user_id = $row['user_id'];
            $this->comment_text = $row['comment_text'];
            $this->status = $row['status'];
            $this->parent_id = $row['parent_id'];
            $this->created_at = $row['created_at'];
            $this->username = $row['username'];
            $this->full_name = $row['full_name'];
            return true;
        }
        
        return false;
    }
    
    // Create a comment
    public function create() {
        $query = 'INSERT INTO ' . $this->table . '
                  (content_type, content_id, user_id, comment_text, status, parent_id)
                  VALUES (:content_type, :content_id, :user_id, :comment_text, :status, :parent_id)
                  RETURNING id, created_at';
        
        $stmt = $this->conn->prepare($query);
        
        // Clean data
        $this->content_type = htmlspecialchars(strip_tags($this->content_type));
        $this->content_id = htmlspecialchars(strip_tags($this->content_id));
        $this->comment_text = htmlspecialchars(strip_tags($this->comment_text));
        
        // For a Christian radio station, we may want to auto-approve comments 
        // or set to pending for manual approval depending on preferences
        $this->status = isset($this->status) ? $this->status : 'approved';
        
        // Bind data
        $stmt->bindParam(':content_type', $this->content_type);
        $stmt->bindParam(':content_id', $this->content_id);
        $stmt->bindParam(':user_id', $this->user_id);
        $stmt->bindParam(':comment_text', $this->comment_text);
        $stmt->bindParam(':status', $this->status);
        $stmt->bindParam(':parent_id', $this->parent_id);
        
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
    
    // Update a comment
    public function update() {
        $query = 'UPDATE ' . $this->table . '
                  SET
                    comment_text = :comment_text,
                    status = :status
                  WHERE
                    id = :id
                  RETURNING created_at';
        
        $stmt = $this->conn->prepare($query);
        
        // Clean data
        $this->comment_text = htmlspecialchars(strip_tags($this->comment_text));
        $this->status = htmlspecialchars(strip_tags($this->status));
        $this->id = htmlspecialchars(strip_tags($this->id));
        
        // Bind data
        $stmt->bindParam(':comment_text', $this->comment_text);
        $stmt->bindParam(':status', $this->status);
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
    
    // Delete a comment
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
    
    // Get all pending comments (for admin)
    public function read_pending() {
        $query = 'SELECT 
                    c.id, 
                    c.content_type, 
                    c.content_id,
                    c.user_id,
                    c.comment_text,
                    c.status,
                    c.parent_id,
                    c.created_at,
                    u.username,
                    u.full_name
                  FROM 
                    ' . $this->table . ' c
                  LEFT JOIN
                    users u ON c.user_id = u.id
                  WHERE 
                    c.status = \'pending\'
                  ORDER BY
                    c.created_at ASC';
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt;
    }
    
    // Update comment status (approve/reject)
    public function update_status() {
        $query = 'UPDATE ' . $this->table . '
                  SET
                    status = :status
                  WHERE
                    id = :id';
        
        $stmt = $this->conn->prepare($query);
        
        // Clean data
        $this->status = htmlspecialchars(strip_tags($this->status));
        $this->id = htmlspecialchars(strip_tags($this->id));
        
        // Bind data
        $stmt->bindParam(':status', $this->status);
        $stmt->bindParam(':id', $this->id);
        
        // Execute query
        if($stmt->execute()) {
            return true;
        }
        
        printf("Error: %s.\n", $stmt->error);
        
        return false;
    }
    
    // Get all replies to a comment
    public function read_replies() {
        $query = 'SELECT 
                    c.id, 
                    c.content_type, 
                    c.content_id,
                    c.user_id,
                    c.comment_text,
                    c.status,
                    c.parent_id,
                    c.created_at,
                    u.username,
                    u.full_name
                  FROM 
                    ' . $this->table . ' c
                  LEFT JOIN
                    users u ON c.user_id = u.id
                  WHERE 
                    c.parent_id = :parent_id AND
                    c.status = \'approved\'
                  ORDER BY
                    c.created_at ASC';
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':parent_id', $this->id);
        $stmt->execute();
        
        return $stmt;
    }
}
?>