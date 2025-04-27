<?php
class PostgresDatabase {
    private $host;
    private $db_name;
    private $username;
    private $password;
    private $port;
    private $conn;
    
    public function __construct() {
        // Get credentials from environment variables 
        $this->host = getenv('PGHOST');
        $this->db_name = getenv('PGDATABASE');
        $this->username = getenv('PGUSER');
        $this->password = getenv('PGPASSWORD');
        $this->port = getenv('PGPORT');
        
        // Default values if environment variables are not set
        if (!$this->host) $this->host = 'localhost';
        if (!$this->db_name) $this->db_name = 'postgres';
        if (!$this->username) $this->username = 'postgres';
        if (!$this->password) $this->password = 'postgres';
        if (!$this->port) $this->port = '5432';
    }
    
    public function connect() {
        $this->conn = null;
        
        try {
            $dsn = "pgsql:host={$this->host};port={$this->port};dbname={$this->db_name}";
            $this->conn = new PDO($dsn, $this->username, $this->password);
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            
            // Set the application name
            $this->conn->exec("SET application_name = 'grace_waves_radio'");
        } catch(PDOException $e) {
            echo 'Connection Error: ' . $e->getMessage();
        }
        
        return $this->conn;
    }
    
    public function getConnectionString() {
        return "pgsql:host={$this->host};port={$this->port};dbname={$this->db_name}";
    }
}
?>