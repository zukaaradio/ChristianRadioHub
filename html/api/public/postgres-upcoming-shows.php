<?php
// Headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

// Include necessary models
require_once '../models/PostgresSchedule.php';

// Get upcoming shows
$schedule = new PostgresSchedule();
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
            'showId' => $row['show_id'],
            'showTitle' => $row['show_title'],
            'host' => $row['host'],
            'startTime' => $row['start_time'],
            'endTime' => $row['end_time'],
            'status' => $row['status'],
            'isRecurring' => $row['is_recurring']
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