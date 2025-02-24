function showStats(category) {
    const container = document.getElementById('statsContainer');
    const data = JSON.parse(localStorage.getItem(category + 'Ratings')) || [];
    
    // Butonları güncelle
    document.querySelector('.button-men').classList.toggle('active', category === 'men');
    document.querySelector('.button-women').classList.toggle('active', category === 'women');
    
    // İçeriği temizle
    container.innerHTML = '';
    
    // Toplam puana göre sırala (en yüksekten en düşüğe)
    data.sort((a, b) => b.totalRating - a.totalRating);
    
    // Sıralama numarası için sayaç
    let rank = 1;
    
    data.forEach(person => {
        if (person.voteCount > 0) {
            const card = createPersonCard(person, rank);
            container.appendChild(card);
            rank++;
        }
    });
}

function createPersonCard(person, rank) {
    const card = document.createElement('div');
    card.className = 'person-card';
    
    card.innerHTML = `
        <div class="rank-badge">#${rank}</div>
        <img src="${person.photo}" alt="${person.name}" class="person-photo">
        <div class="person-info">
            <div class="person-name">${person.name}</div>
            <div class="person-rating">
                <div class="total-rating">
                    Toplam Puan: ${person.totalRating}
                </div>
                <div class="average-rating">
                    Ortalama: ${person.averageRating} ⭐
                </div>
                <div class="vote-count">
                    ${person.voteCount} kişi oyladı
                </div>
            </div>
        </div>
    `;
    
    return card;
}

// Sayfa yüklendiğinde women stats'i göster
document.addEventListener('DOMContentLoaded', () => showStats('women')); 