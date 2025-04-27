<?php
// Headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

// Include necessary models
require_once '../models/Schedule.php';

// Get upcoming shows
$schedule = new Schedule();
$result = $schedule->read_upcoming(5); // Limit to 5 upcoming shows

// Check if any shows exist
$num = $result->rowCount();

if($num > 0) {
    // Shows array
    $shows_arr = array();
    
    // Retrieve table contents
    while($row = $result->fetch()) {
        $show_item = array(
            'id' => $row['id'],
            'showId' => $row['showId'],
            'showTitle' => $row['showTitle'],
            'host' => $row['host'],
            'startTime' => $row['startTime'],
            'endTime' => $row['endTime'],
            'status' => $row['status'],
            'isRecurring' => $row['isRecurring'] == 1
        );
        
        // Push to "data"
        array_push($shows_arr, $show_item);
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