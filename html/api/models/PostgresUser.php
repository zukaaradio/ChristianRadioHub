<?php
require_once '../config/PostgresDatabase.php';

class PostgresUser {
    private $conn;
    private $table = 'users';
    
    // User properties
    public $id;
    public $username;
    public $password;
    public $full_name;
    public $role;
    public $created_at;
    
    public function __construct() {
        $database = new PostgresDatabase();
        $this->conn = $database->connect();
    }
    
    // Get a user by ID
    public function read_single() {
        $query = 'SELECT 
                    id, 
                    username, 
                    password,
                    full_name,
                    role,
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
            $this->username = $row['username'];
            $this->password = $row['password'];
            $this->full_name = $row['full_name'];
            $this->role = $row['role'];
            $this->created_at = $row['created_at'];
            return true;
        }
        
        return false;
    }
    
    // Get a user by username
    public function read_by_username() {
        $query = 'SELECT 
                    id, 
                    username, 
                    password,
                    full_name,
                    role,
                    created_at
                  FROM 
                    ' . $this->table . '
                  WHERE 
                    username = :username
                  LIMIT 1';
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':username', $this->username);
        $stmt->execute();
        
        $row = $stmt->fetch();
        
        if($row) {
            $this->id = $row['id'];
            $this->username = $row['username'];
            $this->password = $row['password'];
            $this->full_name = $row['full_name'];
            $this->role = $row['role'];
            $this->created_at = $row['created_at'];
            return true;
        }
        
        return false;
    }
    
    // Create a new user
    public function create() {
        $query = 'INSERT INTO ' . $this->table . '
                  (username, password, full_name, role)
                  VALUES (:username, :password, :full_name, :role)
                  RETURNING id, username, full_name, role, created_at';
        
        $stmt = $this->conn->prepare($query);
        
        // Clean data
        $this->username = htmlspecialchars(strip_tags($this->username));
        $this->password = htmlspecialchars(strip_tags($this->password));
        $this->full_name = htmlspecialchars(strip_tags($this->full_name));
        $this->role = htmlspecialchars(strip_tags($this->role));
        
        // Bind data
        $stmt->bindParam(':username', $this->username);
        $stmt->bindParam(':password', $this->password);
        $stmt->bindParam(':full_name', $this->full_name);
        $stmt->bindParam(':role', $this->role);
        
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
    
    // Update a user
    public function update() {
        $query = 'UPDATE ' . $this->table . '
                  SET
                    username = :username,
                    full_name = :full_name,
                    role = :role
                  WHERE
                    id = :id
                  RETURNING id, username, full_name, role, created_at';
        
        $stmt = $this->conn->prepare($query);
        
        // Clean data
        $this->username = htmlspecialchars(strip_tags($this->username));
        $this->full_name = htmlspecialchars(strip_tags($this->full_name));
        $this->role = htmlspecialchars(strip_tags($this->role));
        $this->id = htmlspecialchars(strip_tags($this->id));
        
        // Bind data
        $stmt->bindParam(':username', $this->username);
        $stmt->bindParam(':full_name', $this->full_name);
        $stmt->bindParam(':role', $this->role);
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
    
    // Update password
    public function update_password() {
        $query = 'UPDATE ' . $this->table . '
                  SET
                    password = :password
                  WHERE
                    id = :id';
        
        $stmt = $this->conn->prepare($query);
        
        // Clean data
        $this->password = htmlspecialchars(strip_tags($this->password));
        $this->id = htmlspecialchars(strip_tags($this->id));
        
        // Bind data
        $stmt->bindParam(':password', $this->password);
        $stmt->bindParam(':id', $this->id);
        
        // Execute query
        if($stmt->execute()) {
            return true;
        }
        
        printf("Error: %s.\n", $stmt->error);
        
        return false;
    }
    
    // Delete a user
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
    
    // Get all users
    public function read() {
        $query = 'SELECT 
                    id, 
                    username, 
                    full_name,
                    role,
                    created_at
                  FROM 
                    ' . $this->table . '
                  ORDER BY
                    created_at DESC';
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt;
    }
}
?>