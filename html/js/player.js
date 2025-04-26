document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const listenNowBtn = document.getElementById('listen-now');
    const playerSection = document.getElementById('player-section');
    const audioPlayer = document.getElementById('audio-player');
    const playPauseBtn = document.getElementById('play-pause');
    const volumeControl = document.getElementById('volume');
    const streamTitle = document.getElementById('stream-title');
    const showInfo = document.getElementById('show-info');
    
    // Flag to track if the player has been initialized
    let playerInitialized = false;
    
    // Get current stream from API
    async function fetchCurrentStream() {
        try {
            const response = await fetch('api/current-stream.php');
            if (!response.ok) {
                throw new Error('Failed to fetch stream data');
            }
            
            const data = await response.json();
            
            // Update stream info
            if (data.stream) {
                streamTitle.textContent = data.stream.title;
                audioPlayer.src = data.stream.streamUrl;
            }
            
            // Update show info if available
            if (data.currentShow) {
                showInfo.textContent = `${data.currentShow.title} with ${data.currentShow.host}`;
            } else {
                showInfo.textContent = 'Regular Programming';
            }
            
        } catch (error) {
            console.error('Error fetching stream data:', error);
        }
    }
    
    // Initialize player
    function initializePlayer() {
        if (!playerInitialized) {
            fetchCurrentStream();
            playerSection.style.display = 'block';
            playerInitialized = true;
        }
    }
    
    // Toggle play/pause
    function togglePlayPause() {
        if (audioPlayer.paused) {
            audioPlayer.play()
                .then(() => {
                    playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
                })
                .catch(error => {
                    console.error('Error playing audio:', error);
                });
        } else {
            audioPlayer.pause();
            playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        }
    }
    
    // Set volume
    function setVolume() {
        audioPlayer.volume = volumeControl.value;
    }
    
    // Listen for events
    listenNowBtn.addEventListener('click', function() {
        initializePlayer();
        togglePlayPause();
    });
    
    playPauseBtn.addEventListener('click', togglePlayPause);
    volumeControl.addEventListener('input', setVolume);
    
    // Handle audio events
    audioPlayer.addEventListener('playing', function() {
        playPauseBtn.innerHTML = '<i class="fas fa-pause"></i>';
    });
    
    audioPlayer.addEventListener('pause', function() {
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
    });
    
    audioPlayer.addEventListener('ended', function() {
        playPauseBtn.innerHTML = '<i class="fas fa-play"></i>';
        // Try to reconnect
        setTimeout(() => {
            if (playerInitialized) {
                fetchCurrentStream();
                audioPlayer.play().catch(error => {
                    console.error('Error reconnecting to stream:', error);
                });
            }
        }, 2000);
    });
    
    // Initialize volume
    setVolume();
    
    // Auto-update stream info every 5 minutes
    setInterval(function() {
        if (playerInitialized) {
            fetchCurrentStream();
        }
    }, 5 * 60 * 1000);
});