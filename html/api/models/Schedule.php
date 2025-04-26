<?php
require_once '../config/Database.php';

class Schedule {
    private $conn;
    private $table = 'schedules';
    
    // Schedule properties
    public $id;
    public $showId;
    public $startTime;
    public $endTime;
    public $status;
    public $isRecurring;
    public $recurringDays;
    public $created_at;
    
    // Show properties from join
    public $showTitle;
    public $host;
    
    public function __construct() {
        $database = new Database();
        $this->conn = $database->connect();
    }
    
    // Get all schedules
    public function read() {
        $query = 'SELECT 
                    s.id, 
                    s.showId, 
                    s.startTime,
                    s.endTime,
                    s.status,
                    s.isRecurring,
                    s.recurringDays,
                    s.created_at,
                    sh.title as showTitle,
                    sh.host
                  FROM 
                    ' . $this->table . ' s
                  LEFT JOIN
                    shows sh ON s.showId = sh.id
                  ORDER BY
                    s.startTime ASC';
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt;
    }
    
    // Get upcoming schedules
    public function read_upcoming($count = 5) {
        $query = 'SELECT 
                    s.id, 
                    s.showId, 
                    s.startTime,
                    s.endTime,
                    s.status,
                    s.isRecurring,
                    s.recurringDays,
                    s.created_at,
                    sh.title as showTitle,
                    sh.host
                  FROM 
                    ' . $this->table . ' s
                  LEFT JOIN
                    shows sh ON s.showId = sh.id
                  WHERE
                    s.startTime >= NOW()
                  ORDER BY
                    s.startTime ASC
                  LIMIT :count';
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':count', $count, PDO::PARAM_INT);
        $stmt->execute();
        
        return $stmt;
    }
    
    // Get current schedule
    public function read_current() {
        $query = 'SELECT 
                    s.id, 
                    s.showId, 
                    s.startTime,
                    s.endTime,
                    s.status,
                    s.isRecurring,
                    s.recurringDays,
                    s.created_at,
                    sh.title as showTitle,
                    sh.host
                  FROM 
                    ' . $this->table . ' s
                  LEFT JOIN
                    shows sh ON s.showId = sh.id
                  WHERE
                    s.startTime <= NOW() AND s.endTime >= NOW()
                  LIMIT 0,1';
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        $row = $stmt->fetch();
        
        if($row) {
            $this->id = $row['id'];
            $this->showId = $row['showId'];
            $this->startTime = $row['startTime'];
            $this->endTime = $row['endTime'];
            $this->status = $row['status'];
            $this->isRecurring = $row['isRecurring'];
            $this->recurringDays = $row['recurringDays'];
            $this->created_at = $row['created_at'];
            $this->showTitle = $row['showTitle'];
            $this->host = $row['host'];
            return true;
        }
        
        return false;
    }
    
    // Get a schedule by ID
    public function read_single() {
        $query = 'SELECT 
                    s.id, 
                    s.showId, 
                    s.startTime,
                    s.endTime,
                    s.status,
                    s.isRecurring,
                    s.recurringDays,
                    s.created_at,
                    sh.title as showTitle,
                    sh.host
                  FROM 
                    ' . $this->table . ' s
                  LEFT JOIN
                    shows sh ON s.showId = sh.id
                  WHERE 
                    s.id = :id
                  LIMIT 0,1';
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id);
        $stmt->execute();
        
        $row = $stmt->fetch();
        
        if($row) {
            $this->id = $row['id'];
            $this->showId = $row['showId'];
            $this->startTime = $row['startTime'];
            $this->endTime = $row['endTime'];
            $this->status = $row['status'];
            $this->isRecurring = $row['isRecurring'];
            $this->recurringDays = $row['recurringDays'];
            $this->created_at = $row['created_at'];
            $this->showTitle = $row['showTitle'];
            $this->host = $row['host'];
            return true;
        }
        
        return false;
    }
    
    // Create a schedule
    public function create() {
        $query = 'INSERT INTO ' . $this->table . '
                  SET
                    showId = :showId,
                    startTime = :startTime,
                    endTime = :endTime,
                    status = :status,
                    isRecurring = :isRecurring,
                    recurringDays = :recurringDays';
        
        $stmt = $this->conn->prepare($query);
        
        // Clean data
        $this->showId = htmlspecialchars(strip_tags($this->showId));
        $this->startTime = htmlspecialchars(strip_tags($this->startTime));
        $this->endTime = htmlspecialchars(strip_tags($this->endTime));
        $this->status = htmlspecialchars(strip_tags($this->status));
        $this->recurringDays = htmlspecialchars(strip_tags($this->recurringDays));
        
        // Bind data
        $stmt->bindParam(':showId', $this->showId);
        $stmt->bindParam(':startTime', $this->startTime);
        $stmt->bindParam(':endTime', $this->endTime);
        $stmt->bindParam(':status', $this->status);
        $stmt->bindParam(':isRecurring', $this->isRecurring, PDO::PARAM_BOOL);
        $stmt->bindParam(':recurringDays', $this->recurringDays);
        
        // Execute query
        if($stmt->execute()) {
            $this->id = $this->conn->lastInsertId();
            return true;
        }
        
        printf("Error: %s.\n", $stmt->error);
        
        return false;
    }
    
    // Update a schedule
    public function update() {
        $query = 'UPDATE ' . $this->table . '
                  SET
                    showId = :showId,
                    startTime = :startTime,
                    endTime = :endTime,
                    status = :status,
                    isRecurring = :isRecurring,
                    recurringDays = :recurringDays
                  WHERE
                    id = :id';
        
        $stmt = $this->conn->prepare($query);
        
        // Clean data
        $this->showId = htmlspecialchars(strip_tags($this->showId));
        $this->startTime = htmlspecialchars(strip_tags($this->startTime));
        $this->endTime = htmlspecialchars(strip_tags($this->endTime));
        $this->status = htmlspecialchars(strip_tags($this->status));
        $this->recurringDays = htmlspecialchars(strip_tags($this->recurringDays));
        $this->id = htmlspecialchars(strip_tags($this->id));
        
        // Bind data
        $stmt->bindParam(':showId', $this->showId);
        $stmt->bindParam(':startTime', $this->startTime);
        $stmt->bindParam(':endTime', $this->endTime);
        $stmt->bindParam(':status', $this->status);
        $stmt->bindParam(':isRecurring', $this->isRecurring, PDO::PARAM_BOOL);
        $stmt->bindParam(':recurringDays', $this->recurringDays);
        $stmt->bindParam(':id', $this->id);
        
        // Execute query
        if($stmt->execute()) {
            return true;
        }
        
        printf("Error: %s.\n", $stmt->error);
        
        return false;
    }
    
    // Delete a schedule
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