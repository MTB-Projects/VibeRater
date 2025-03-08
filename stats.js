// API URLs
const API_URL = {
    RATINGS: 'https://api.viberater.fun/items/ratings'
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

// Çıkış yapma fonksiyonu
function logout() {
    // Token'ı localStorage'dan sil
    localStorage.removeItem('token');
    
    // Kullanıcıyı login sayfasına yönlendir
    window.location.href = '/login.html';
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
    
    // Geçerli öğeleri filtrele
    const validItems = items.filter(item => 
        item && 
        item.total_votes > 0 && 
        item.image_url && 
        item.image_url !== '' && 
        !item.image_url.includes('300x300.jpg')
    );
    
    if (validItems.length === 0) {
        container.innerHTML = `
            <div class="no-stats-message" style="text-align: center; padding: 50px; width: 100%;">
                <h3>Henüz yeterli veri yok</h3>
                <p>İstatistiklerin gösterilmesi için daha fazla oylama yapılması gerekiyor.</p>
            </div>
        `;
        return;
    }
    
    // Ortalama puana göre sırala
    const sortedItems = validItems.sort((a, b) => b.average_rating - a.average_rating);
    
    sortedItems.forEach((item, index) => {
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
            <img src="${item.image_url}" alt="${item.title}" class="person-photo" onerror="this.onerror=null; this.src='default-photo.png'; this.alt='Fotoğraf yüklenemedi';">
            <div class="person-info">
                <h2 class="person-name">${item.title}</h2>
                <div class="vote-info">
                    <span class="rating-score">⭐ ${item.average_rating.toFixed(1)}</span>
                    <span class="vote-count" data-item-id="${item.id}">👥 ${item.total_votes}</span>
                </div>
            </div>
        `;
        
        container.appendChild(itemElement);
    });
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    fetchStats();
}); 