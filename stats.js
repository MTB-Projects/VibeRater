// API URLs
const API_URL = {
    RANDOM: 'https://test.umuttopalak.com/items/random',
    VOTE: 'https://test.umuttopalak.com/votes/vote',
    STATS: 'https://test.umuttopalak.com/items/ratings'
};

async function showStats() {
    const container = document.getElementById('statsContainer');
    
    try {
        // API'den istatistikleri al
        const response = await fetch(`${API_URL.STATS}`);
        const data = await response.json();
        
        // data.items array'ini average_rating'e göre sıralayalım
        const sortedItems = data.items.sort((a, b) => b.average_rating - a.average_rating);
        
        // Sıralama numarası için sayaç
        let rank = 1;
        
        // En az bir oyu olan fotoğrafları göster
        sortedItems.forEach((item, index) => {
            if (item.total_votes > 0) {
                const card = createPersonCard(item, rank);
                container.appendChild(card);
                rank++;
            }
        });

    } catch (error) {
        console.error('Stats yüklenirken hata:', error);
        container.innerHTML = '<div class="error">İstatistikler yüklenirken bir hata oluştu.</div>';
    }
}

function createPersonCard(item, rank) {
    const card = document.createElement('div');
    card.className = 'person-card';
    
    card.innerHTML = `
        <div class="rank-badge">#${rank}</div>
        <img src="${item.image_url}" alt="Photo ${item.id}" class="person-photo">
        <div class="person-info">
            <div class="person-rating">
                <div class="average-rating">
                    ${item.average_rating.toFixed(1)} ⭐
                </div>
                <div class="total-votes">
                    ${item.total_votes} oy
                </div>
            </div>
        </div>
    `;
    
    return card;
}

// Sayfa yüklendiğinde stats'i göster
document.addEventListener('DOMContentLoaded', showStats); 