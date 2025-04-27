<?php
// Headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

// Include necessary models
require_once '../models/PostgresStream.php';
require_once '../models/PostgresSchedule.php';

// Get current stream
$stream = new PostgresStream();
$result = $stream->read_active();

// If no active stream is found, try to get the first one
if(!$result) {
    $allStreams = $stream->read();
    if($allStreams->rowCount() > 0) {
        $row = $allStreams->fetch();
        $stream->id = $row['id'];
        $stream->title = $row['title'];
        $stream->stream_url = $row['stream_url'];
        $stream->description = $row['description'];
        $stream->is_active = $row['is_active'];
        $stream->created_at = $row['created_at'];
    } else {
        // If no streams exist, create a default one
        $stream->title = 'Grace Waves Christian Radio';
        $stream->stream_url = 'https://radio.brentwooddrivesda.org/listen/bwd_radio/radio.mp3';
        $stream->description = 'Default Christian radio stream';
        $stream->is_active = true;
        $stream->create();
    }
}

// Get current show if any is playing
$schedule = new PostgresSchedule();
$currentShow = null;
if($schedule->read_current()) {
    $currentShow = [
        'id' => $schedule->id,
        'title' => $schedule->show_title,
        'host' => $schedule->host,
        'startTime' => $schedule->start_time,
        'endTime' => $schedule->end_time
    ];
}

// Create response
$response = [
    'stream' => [
        'id' => $stream->id,
        'title' => $stream->title,
        'streamUrl' => $stream->stream_url,
        'description' => $stream->description
    ]
];

if($currentShow) {
    $response['currentShow'] = $currentShow;
}

// Set response code and output
http_response_code(200);
echo json_encode($response);
?>