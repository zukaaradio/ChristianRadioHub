<?php
require_once '../config/PostgresDatabase.php';

class PostgresSchedule {
    private $conn;
    private $table = 'schedules';
    
    // Schedule properties
    public $id;
    public $show_id;
    public $start_time;
    public $end_time;
    public $status;
    public $is_recurring;
    public $recurring_days;
    public $created_at;
    
    // Show properties from join
    public $show_title;
    public $host;
    
    public function __construct() {
        $database = new PostgresDatabase();
        $this->conn = $database->connect();
    }
    
    // Get all schedules
    public function read() {
        $query = 'SELECT 
                    s.id, 
                    s.show_id, 
                    s.start_time,
                    s.end_time,
                    s.status,
                    s.is_recurring,
                    s.recurring_days,
                    s.created_at,
                    sh.title as show_title,
                    sh.host
                  FROM 
                    ' . $this->table . ' s
                  LEFT JOIN
                    shows sh ON s.show_id = sh.id
                  ORDER BY
                    s.start_time ASC';
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        return $stmt;
    }
    
    // Get upcoming schedules
    public function read_upcoming($count = 5) {
        $query = 'SELECT 
                    s.id, 
                    s.show_id, 
                    s.start_time,
                    s.end_time,
                    s.status,
                    s.is_recurring,
                    s.recurring_days,
                    s.created_at,
                    sh.title as show_title,
                    sh.host
                  FROM 
                    ' . $this->table . ' s
                  LEFT JOIN
                    shows sh ON s.show_id = sh.id
                  WHERE
                    s.start_time >= NOW()
                  ORDER BY
                    s.start_time ASC
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
                    s.show_id, 
                    s.start_time,
                    s.end_time,
                    s.status,
                    s.is_recurring,
                    s.recurring_days,
                    s.created_at,
                    sh.title as show_title,
                    sh.host
                  FROM 
                    ' . $this->table . ' s
                  LEFT JOIN
                    shows sh ON s.show_id = sh.id
                  WHERE
                    s.start_time <= NOW() AND s.end_time >= NOW()
                  LIMIT 1';
        
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        
        $row = $stmt->fetch();
        
        if($row) {
            $this->id = $row['id'];
            $this->show_id = $row['show_id'];
            $this->start_time = $row['start_time'];
            $this->end_time = $row['end_time'];
            $this->status = $row['status'];
            $this->is_recurring = $row['is_recurring'];
            $this->recurring_days = $row['recurring_days'];
            $this->created_at = $row['created_at'];
            $this->show_title = $row['show_title'];
            $this->host = $row['host'];
            return true;
        }
        
        return false;
    }
    
    // Get a schedule by ID
    public function read_single() {
        $query = 'SELECT 
                    s.id, 
                    s.show_id, 
                    s.start_time,
                    s.end_time,
                    s.status,
                    s.is_recurring,
                    s.recurring_days,
                    s.created_at,
                    sh.title as show_title,
                    sh.host
                  FROM 
                    ' . $this->table . ' s
                  LEFT JOIN
                    shows sh ON s.show_id = sh.id
                  WHERE 
                    s.id = :id
                  LIMIT 1';
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(':id', $this->id);
        $stmt->execute();
        
        $row = $stmt->fetch();
        
        if($row) {
            $this->id = $row['id'];
            $this->show_id = $row['show_id'];
            $this->start_time = $row['start_time'];
            $this->end_time = $row['end_time'];
            $this->status = $row['status'];
            $this->is_recurring = $row['is_recurring'];
            $this->recurring_days = $row['recurring_days'];
            $this->created_at = $row['created_at'];
            $this->show_title = $row['show_title'];
            $this->host = $row['host'];
            return true;
        }
        
        return false;
    }
    
    // Create a schedule
    public function create() {
        $query = 'INSERT INTO ' . $this->table . '
                  (show_id, start_time, end_time, status, is_recurring, recurring_days)
                  VALUES (:show_id, :start_time, :end_time, :status, :is_recurring, :recurring_days)
                  RETURNING id, created_at';
        
        $stmt = $this->conn->prepare($query);
        
        // Clean data
        $this->show_id = htmlspecialchars(strip_tags($this->show_id));
        $this->start_time = htmlspecialchars(strip_tags($this->start_time));
        $this->end_time = htmlspecialchars(strip_tags($this->end_time));
        $this->status = htmlspecialchars(strip_tags($this->status));
        $this->recurring_days = htmlspecialchars(strip_tags($this->recurring_days));
        
        // Bind data
        $stmt->bindParam(':show_id', $this->show_id);
        $stmt->bindParam(':start_time', $this->start_time);
        $stmt->bindParam(':end_time', $this->end_time);
        $stmt->bindParam(':status', $this->status);
        $stmt->bindParam(':is_recurring', $this->is_recurring, PDO::PARAM_BOOL);
        $stmt->bindParam(':recurring_days', $this->recurring_days);
        
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
    
    // Update a schedule
    public function update() {
        $query = 'UPDATE ' . $this->table . '
                  SET
                    show_id = :show_id,
                    start_time = :start_time,
                    end_time = :end_time,
                    status = :status,
                    is_recurring = :is_recurring,
                    recurring_days = :recurring_days
                  WHERE
                    id = :id
                  RETURNING created_at';
        
        $stmt = $this->conn->prepare($query);
        
        // Clean data
        $this->show_id = htmlspecialchars(strip_tags($this->show_id));
        $this->start_time = htmlspecialchars(strip_tags($this->start_time));
        $this->end_time = htmlspecialchars(strip_tags($this->end_time));
        $this->status = htmlspecialchars(strip_tags($this->status));
        $this->recurring_days = htmlspecialchars(strip_tags($this->recurring_days));
        $this->id = htmlspecialchars(strip_tags($this->id));
        
        // Bind data
        $stmt->bindParam(':show_id', $this->show_id);
        $stmt->bindParam(':start_time', $this->start_time);
        $stmt->bindParam(':end_time', $this->end_time);
        $stmt->bindParam(':status', $this->status);
        $stmt->bindParam(':is_recurring', $this->is_recurring, PDO::PARAM_BOOL);
        $stmt->bindParam(':recurring_days', $this->recurring_days);
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