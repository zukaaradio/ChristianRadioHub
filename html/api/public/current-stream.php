<?php
// Headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

// Include necessary models
require_once '../models/Stream.php';
require_once '../models/Schedule.php';

// Get current stream
$stream = new Stream();
$result = $stream->read_active();

// If no active stream is found, try to get the first one
if(!$result) {
    $allStreams = $stream->read();
    if($allStreams->rowCount() > 0) {
        $row = $allStreams->fetch();
        $stream->id = $row['id'];
        $stream->title = $row['title'];
        $stream->streamUrl = $row['streamUrl'];
        $stream->description = $row['description'];
        $stream->isActive = $row['isActive'];
        $stream->created_at = $row['created_at'];
    } else {
        // If no streams exist, create a default one
        $stream->title = 'Grace Waves Christian Radio';
        $stream->streamUrl = 'https://radio.brentwooddrivesda.org/listen/bwd_radio/radio.mp3';
        $stream->description = 'Default Christian radio stream';
        $stream->isActive = 1;
        $stream->create();
    }
}

// Get current show if any is playing
$schedule = new Schedule();
$currentShow = null;
if($schedule->read_current()) {
    $currentShow = [
        'id' => $schedule->id,
        'title' => $schedule->showTitle,
        'host' => $schedule->host,
        'startTime' => $schedule->startTime,
        'endTime' => $schedule->endTime
    ];
}

// Create response
$response = [
    'stream' => [
        'id' => $stream->id,
        'title' => $stream->title,
        'streamUrl' => $stream->streamUrl,
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