// API URLs
const API_URL = {
    RANDOM: 'https://test.umuttopalak.com/items/random',
    VOTE: 'https://test.umuttopalak.com/votes/vote',
    RATINGS: 'https://test.umuttopalak.com/items/ratings'
};

// Global değişkenler
let currentPhotos = [];
let currentCategory = '';

// API Headers
function getHeaders() {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        'Accept': 'application/json'
    };
}

// UI işlemleri
const UI = {
    elements: {
        welcomeScreen: document.getElementById('welcomeScreen'),
        mainContent: document.getElementById('mainContent'),
        photo: document.getElementById('photo'),
        slider: document.getElementById('ratingSlider'),
        sliderValue: document.getElementById('sliderValue'),
        rateButton: document.getElementById('rateButton')
    },

    init() {
        this.setupEventListeners();
        this.setupSlider();
        this.checkAuth();
    },

    checkAuth() {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login.html';
        }
    },

    setupEventListeners() {
        // Oylama butonu
        this.elements.rateButton?.addEventListener('click', () => {
            const rating = this.elements.slider.value;
            ratePhoto(rating);
        });

        // Slider değişimi
        this.elements.slider?.addEventListener('input', (e) => {
            this.elements.sliderValue.textContent = e.target.value;
            updateSliderColor(e.target, e.target.value);
            
            // Slider değerini göster
            const sliderValueElement = document.getElementById('sliderValue');
            if (sliderValueElement) {
                sliderValueElement.textContent = e.target.value;
                sliderValueElement.style.opacity = '1';
            }
        });
    },

    setupSlider() {
        if (this.elements.slider && this.elements.sliderValue) {
            this.elements.sliderValue.textContent = this.elements.slider.value;
            updateSliderColor(this.elements.slider, this.elements.slider.value);
        }
    },

    updatePhoto(photoData) {
        if (photoData) {
            this.elements.photo.src = photoData.photo;
            this.elements.photo.alt = photoData.name || 'Fotoğraf';
        } else {
            this.elements.photo.src = '';
            this.elements.photo.alt = 'Fotoğraf yüklenemedi';
        }
    }
};

// Fotoğraf ve oylama işlemleri
async function fetchPhoto() {
    try {
        // URL'i konsola yazdıralım ve kontrol edelim
        console.log(`Fetching: ${API_URL.RANDOM}?gender=${currentCategory}`);
        
        const response = await fetch(`${API_URL.RANDOM}?gender=${currentCategory}`, {
            method: 'GET',
            headers: getHeaders()
        });

        // Response detaylarını görelim
        console.log('Response status:', response.status);
        console.log('Response headers:', response.headers);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received data:', data); // Gelen veriyi kontrol edelim

        currentPhotos = [{
            id: data.id,
            photo: data.image_url,
            name: data.title
        }];
        UI.updatePhoto(currentPhotos[0]);
    } catch (error) {
        console.error('Fotoğraf yükleme hatası:', error);
        currentPhotos = [];
        UI.updatePhoto(null);
        
        if (error.message.includes('401')) {
            alert('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
            window.location.href = '/login.html';
        }
    }
}

async function ratePhoto(rating) {
    if (currentPhotos.length > 0) {
        try {
            const sliderValue = UI.elements.slider.value;
            
            const response = await fetch(API_URL.VOTE, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify({
                    item_id: currentPhotos[0].id,
                    rating: parseInt(sliderValue)
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // API'den güncel istatistikleri al
            const statsResponse = await fetch(API_URL.RATINGS, {
                method: 'GET',
                headers: getHeaders()
            });

            if (statsResponse.ok) {
                const statsData = await statsResponse.json();
                // Oylanmış kişinin güncel verilerini bul
                const updatedItem = statsData.items.find(item => item.id === currentPhotos[0].id);
                if (updatedItem) {
                    // Stats sayfasında ilgili kişinin rating score'unu güncelle
                    const ratingElement = document.querySelector(`[data-item-id="${currentPhotos[0].id}"]`);
                    if (ratingElement) {
                        ratingElement.textContent = `⭐ ${updatedItem.average_rating.toFixed(1)}`;
                    }
                }
            }

            // Yeni fotoğraf yükle
            await fetchPhoto();
            resetSlider();

        } catch (error) {
            console.error('Oylama hatası:', error);
            if (error.message.includes('401')) {
                window.location.href = '/login.html';
            }
        }
    }
}

// Yardımcı fonksiyonlar
function updateSliderColor(slider, value) {
    const percent = ((value - slider.min) / (slider.max - slider.min)) * 100;
    const color = currentCategory === 'FEMALE' ? 'var(--primary-women)' : 'var(--primary-men)';
    
    slider.style.background = `linear-gradient(to right, 
        ${color} 0%, 
        ${color} ${percent}%, 
        #e0e0e0 ${percent}%, 
        #e0e0e0 100%
    )`;
}

function resetSlider() {
    const slider = UI.elements.slider;
    const sliderValue = UI.elements.sliderValue;
    if (slider && sliderValue) {
        slider.value = 5;
        sliderValue.textContent = '5';
        updateSliderColor(slider, 5);
    }
}

// Kategori ve ekran yönetimi
window.loadCategory = function(category) {
    UI.elements.welcomeScreen.style.display = 'none';
    UI.elements.mainContent.style.display = 'flex';

    currentCategory = category === 'men' ? 'MALE' : 'FEMALE';
    
    document.body.classList.add(category === 'men' ? 'men-theme' : 'women-theme');
    document.body.classList.remove(category === 'men' ? 'women-theme' : 'men-theme');

    fetchPhoto();
    resetSlider();
};

window.returnToWelcome = function() {
    UI.elements.mainContent.style.display = 'none';
    UI.elements.welcomeScreen.style.display = 'flex';
    document.body.classList.remove('women-theme', 'men-theme');
    resetSlider();
    
    currentCategory = '';
    currentPhotos = [];
};

// İstatistik işlemleri
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
        displayStats(data.items);
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
    items.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'item-card';
        
        const ratingDistribution = item.rating_distribution.split(',').map(Number);
        
        itemElement.innerHTML = `
            <img src="${item.image_url}" alt="${item.title}" class="item-image">
            <div class="item-details">
                <h2>${item.title}</h2>
                <p>${item.description}</p>
                <div class="stats">
                    <p>Toplam Oy: ${item.total_votes}</p>
                    <p>Ortalama Puan: ${item.average_rating.toFixed(2)}</p>
                </div>
                <canvas id="ratingChart${index}" class="rating-chart"></canvas>
            </div>
        `;
        
        container.appendChild(itemElement);
        createChart(`ratingChart${index}`, ratingDistribution);
    });
}

function createChart(canvasId, data) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
            datasets: [{
                label: 'Oylama Dağılımı',
                data: data,
                backgroundColor: 'rgba(54, 162, 235, 0.5)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    UI.init();
    fetchStats();
}); 