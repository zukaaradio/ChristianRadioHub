<?php
// Headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

// Include necessary models
require_once '../models/PostgresShow.php';

// Get featured shows
// For now, just return all shows and limit to max 3
// In the future, we might add a 'featured' flag to shows

$show = new PostgresShow();
$result = $show->read();

// Check if any shows exist
$num = $result->rowCount();

if($num > 0) {
    // Shows array
    $shows_arr = array();
    $counter = 0;
    
    // Retrieve table contents (limit to 3 for featured)
    while(($row = $result->fetch()) && $counter < 3) {
        $show_item = array(
            'id' => $row['id'],
            'title' => $row['title'],
            'description' => $row['description'],
            'host' => $row['host'],
            'coverImage' => $row['cover_image'],
            'isRecorded' => $row['is_recorded'],
            'audioFile' => $row['audio_file'],
            'autoRotation' => $row['auto_rotation'],
            'createdAt' => $row['created_at']
        );
        
        // Push to "data"
        array_push($shows_arr, $show_item);
        $counter++;
    }
    
    // Turn to JSON & output
    http_response_code(200);
    echo json_encode($shows_arr);
    
} else {
    // No shows found
    http_response_code(200);
    echo json_encode(array());
}
?>