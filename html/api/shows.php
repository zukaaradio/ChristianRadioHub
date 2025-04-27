<?php
// Headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

// Include show model
require_once 'models/Show.php';

// Start session to check authentication
session_start();

// Check if user is logged in
if(!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['message' => 'Unauthorized']);
    exit;
}

// Initialize show object
$show = new Show();

// Get shows
$result = $show->read();
$num = $result->rowCount();

// Check if any shows exist
if($num > 0) {
    // Shows array
    $shows_arr = [];
    
    // Retrieve table contents
    while($row = $result->fetch()) {
        $show_item = [
            'id' => $row['id'],
            'title' => $row['title'],
            'description' => $row['description'],
            'host' => $row['host'],
            'coverImage' => $row['coverImage'],
            'isRecorded' => $row['isRecorded'] == 1,
            'audioFile' => $row['audioFile'],
            'autoRotation' => $row['autoRotation'] == 1,
            'created_at' => $row['created_at']
        ];
        
        // Push to "data"
        array_push($shows_arr, $show_item);
    }
    
    // Turn to JSON & output
    http_response_code(200);
    echo json_encode($shows_arr);
    
} else {
    // No shows found
    http_response_code(200);
    echo json_encode([]);
}
?>