// API URLs
const API_URL = {
    RATINGS: 'https://test.umuttopalak.com/items/ratings'
};

// API Headers
function getHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept': 'application/json'
    };
}

async function fetchStats() {
    try {
        const response = await fetch(API_URL.RATINGS, {
            method: 'GET',
            headers: getHeaders()
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        // Ortalama puana göre sırala
        const sortedItems = data.items.sort((a, b) => b.average_rating - a.average_rating);
        displayStats(sortedItems);
    } catch (error) {
        console.error('Veri çekme hatası:', error);
        
        if (error.message.includes('401')) {
            alert('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
            window.location.href = '/login.html';
        }
    }
}

function displayStats(items) {
    const container = document.getElementById('statsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    // Ortalama puana göre sırala
    const sortedItems = items.sort((a, b) => b.average_rating - a.average_rating);
    
    sortedItems.forEach((item, index) => {
        if (item.total_votes > 0) {
            const itemElement = document.createElement('div');
            itemElement.className = 'person-card';
            const rank = index + 1;
            
            // Sıralama simgesini belirle
            let rankEmoji = '🏆';
            if (rank === 1) {
                rankEmoji = '👑';
            } else if (rank === 2) {
                rankEmoji = '🥈';
            } else if (rank === 3) {
                rankEmoji = '🥉';
            }
            
            itemElement.innerHTML = `
                <div class="rank-badge ${rank <= 3 ? 'top-rank' : ''}">
                    <span class="rank-emoji">${rankEmoji}</span>
                    <span class="rank-number">#${rank}</span>
                </div>
                <img src="${item.image_url}" alt="${item.title}" class="person-photo">
                <div class="person-info">
                    <h2 class="person-name">${item.title}</h2>
                    <div class="vote-info">
                        <span class="rating-score">⭐ ${item.average_rating.toFixed(1)}</span>
                        <span class="vote-count" data-item-id="${item.id}">👥 ${item.total_votes}</span>
                    </div>
                </div>
            `;
            
            container.appendChild(itemElement);
        }
    });
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    fetchStats();
}); 