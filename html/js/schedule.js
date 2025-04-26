document.addEventListener('DOMContentLoaded', function() {
    // Element
    const upcomingShowsContainer = document.getElementById('upcoming-shows');
    
    // Fetch upcoming shows from API
    async function fetchUpcomingShows() {
        try {
            const response = await fetch('api/upcoming-shows.php');
            if (!response.ok) {
                throw new Error('Failed to fetch upcoming shows');
            }
            
            const shows = await response.json();
            displayUpcomingShows(shows);
            
        } catch (error) {
            console.error('Error fetching upcoming shows:', error);
            upcomingShowsContainer.innerHTML = '<p class="error-message">Unable to load upcoming shows at this time.</p>';
        }
    }
    
    // Display upcoming shows in the container
    function displayUpcomingShows(shows) {
        if (!shows || shows.length === 0) {
            upcomingShowsContainer.innerHTML = '<p class="no-shows">No upcoming shows scheduled at this time.</p>';
            return;
        }
        
        // Clear container
        upcomingShowsContainer.innerHTML = '';
        
        // Add each show as a card
        shows.forEach(show => {
            // Format dates
            const startDate = new Date(show.startTime);
            const endDate = new Date(show.endTime);
            
            const timeString = `${formatDate(startDate)} • ${formatTime(startDate)} - ${formatTime(endDate)}`;
            
            const showCard = document.createElement('div');
            showCard.className = 'schedule-item';
            showCard.innerHTML = `
                <div class="schedule-time">${timeString}</div>
                <div class="schedule-title">${show.title}</div>
                <div class="schedule-host">with ${show.host}</div>
                <p>${show.description}</p>
            `;
            
            upcomingShowsContainer.appendChild(showCard);
        });
    }
    
    // Utility function to format date
    function formatDate(date) {
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }
    
    // Utility function to format time
    function formatTime(date) {
        const options = { hour: 'numeric', minute: '2-digit', hour12: true };
        return date.toLocaleTimeString('en-US', options);
    }
    
    // Load upcoming shows
    fetchUpcomingShows();
    
    // Mock shows for testing (comment out when API is ready)
    const mockShows = [
        {
            startTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours from now
            endTime: new Date(Date.now() + 3.5 * 60 * 60 * 1000).toISOString(), // 3.5 hours from now
            title: 'Morning Devotional',
            host: 'Pastor David Johnson',
            description: 'Start your day with inspiring scripture readings and reflections.'
        },
        {
            startTime: new Date(Date.now() + 5 * 60 * 60 * 1000).toISOString(), // 5 hours from now
            endTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours from now
            title: 'Gospel Hour',
            host: 'Sister Mary Thompson',
            description: 'Uplifting gospel music to feed your soul.'
        },
        {
            startTime: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(), // 8 hours from now
            endTime: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(), // 10 hours from now
            title: 'Biblical Insights',
            host: 'Dr. Robert Winters',
            description: 'Deep dives into biblical passages and their meaning for today\'s Christian.'
        }
    ];
    
    // Use this for testing when API is not available
    displayUpcomingShows(mockShows);
});