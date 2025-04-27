<?php
// Headers
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: POST');
header('Access-Control-Allow-Headers: Access-Control-Allow-Headers, Content-Type, Access-Control-Allow-Methods, Authorization, X-Requested-With');

// Start session to check authentication
session_start();

// Check if user is logged in
if(!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['message' => 'Unauthorized']);
    exit;
}

// Process the request
$data = json_decode(file_get_contents("php://input"));

// Validate input
if(!isset($data->voice)) {
    http_response_code(400);
    echo json_encode(['message' => 'Missing required fields']);
    exit;
}

// Check for OpenAI API key
if(!getenv('OPENAI_API_KEY')) {
    http_response_code(500);
    echo json_encode(['message' => 'OpenAI API key not configured']);
    exit;
}

$apiKey = getenv('OPENAI_API_KEY');
$voice = $data->voice;

// This would normally fetch from a Bible API
// For now, we're using a hard-coded verse for demonstration
$verse = "Romans 15:13 - \"May the God of hope fill you with all joy and peace as you trust in him, so that you may overflow with hope by the power of the Holy Spirit.\"";

// Build the verse announcement script
$prompt = "Today's verse of the day from Grace Waves Christian Radio: " . $verse . " May this verse inspire and guide you throughout your day.";

// OpenAI API request for text-to-speech
try {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://api.openai.com/v1/audio/speech');
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Authorization: Bearer ' . $apiKey
    ]);
    
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
        'model' => 'tts-1',
        'voice' => $voice,
        'input' => $prompt
    ]));
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if($httpCode !== 200) {
        $error = json_decode($response, true);
        http_response_code(500);
        echo json_encode(['message' => 'Error generating speech: ' . ($error['error']['message'] ?? 'Unknown error')]);
        exit;
    }
    
    // Create a unique filename
    $filename = 'verse_' . uniqid() . '.mp3';
    $filepath = '../../uploads/tts/' . $filename;
    
    // Save the audio file
    file_put_contents($filepath, $response);
    
    // Return success response
    http_response_code(200);
    echo json_encode([
        'message' => 'Verse announcement generated successfully',
        'scriptText' => $prompt,
        'audioPath' => '../uploads/tts/' . $filename
    ]);
    
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['message' => 'Error: ' . $e->getMessage()]);
}
?>