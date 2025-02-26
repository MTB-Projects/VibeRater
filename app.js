// API URLs
const API_URL = {
    RANDOM: 'https://test.umuttopalak.com/items/random',
    VOTE: 'https://test.umuttopalak.com/votes/vote'
};

let currentPhotos = [];
let currentCategory = '';

// API'den fotoğraf çekme fonksiyonu
async function fetchPhoto() {
    try {
        const response = await fetch(API_URL.RANDOM);
        const data = await response.json();
        
        // Gelen fotoğraf verisini sakla
        currentPhotos = [{
            id: data.id,
            photo: data.image_url
        }];
        
        // Fotoğrafı göster
        const photoElement = document.getElementById('photo');
        photoElement.src = data.image_url;
        
    } catch (error) {
        console.error('API hatası:', error);
    }
}

// Oylama fonksiyonu
async function ratePhoto(rating) {
    if (currentPhotos.length > 0) {
        const currentPhoto = currentPhotos[0];
        
        try {
            // Oylama isteği gönder
            const response = await fetch(API_URL.VOTE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    item_id: currentPhoto.id,
                    rating: parseInt(rating)
                })
            });

            if (!response.ok) {
                throw new Error('Oylama başarısız');
            }

            // Oylama başarılı, yeni fotoğraf yükle
            await fetchPhoto();
            
            // Slider'ı sıfırla
            const slider = document.getElementById('ratingSlider');
            const sliderValue = document.getElementById('sliderValue');
            if (slider && sliderValue) {
                slider.value = 5;
                sliderValue.textContent = "5";
                updateSliderColor(slider, 5);
            }

        } catch (error) {
            console.error('Oylama hatası:', error);
        }
    }
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
        this.showWelcomeScreen();
        this.setupSlider();
        this.setupRateButton();
    },

    showWelcomeScreen() {
        this.elements.welcomeScreen.style.display = 'flex';
        this.elements.mainContent.style.display = 'none';
    },

    showMainContent() {
        this.elements.welcomeScreen.style.display = 'none';
        this.elements.mainContent.style.display = 'flex';
    },

    setupSlider() {
        if (this.elements.slider && this.elements.sliderValue) {
            this.elements.slider.addEventListener('input', (e) => {
                const value = e.target.value;
                this.elements.sliderValue.textContent = value;
                updateSliderColor(e.target, value);
            });

            // Başlangıç değerlerini ayarla
            this.elements.sliderValue.textContent = this.elements.slider.value;
            updateSliderColor(this.elements.slider, this.elements.slider.value);
        }
    },

    setupRateButton() {
        if (this.elements.rateButton) {
            this.elements.rateButton.addEventListener('click', () => {
                const rating = this.elements.slider.value;
                console.log('Oylama butonu tıklandı, rating:', rating);
                ratePhoto(rating);
            });
        }
    },

    updatePhoto() {
        if (currentPhotos.length > 0) {
            this.elements.photo.src = currentPhotos[0].photo;
            this.elements.photo.alt = currentPhotos[0].name;
        } else {
            this.elements.photo.src = "";
            this.elements.photo.alt = "Fotoğraf yüklenemedi";
        }
    }
};

// Global setupSlider fonksiyonunu kaldır
document.addEventListener('DOMContentLoaded', async () => {
    // İlk fotoğrafı yükle
    await fetchPhoto();
    
    // Oylama butonuna tıklanınca
    const rateButton = document.getElementById('rateButton');
    rateButton.addEventListener('click', () => {
        const rating = document.getElementById('ratingSlider').value;
        ratePhoto(rating);
    });

    // UI'ı başlat
    UI.init();
});

function loadCategory(category) {
    document.getElementById('welcomeScreen').style.display = 'none';
    document.getElementById('mainContent').style.display = 'flex';

    currentCategory = category;
    document.body.classList.add(category === 'women' ? 'women-theme' : 'men-theme');
    document.body.classList.remove(category === 'women' ? 'men-theme' : 'women-theme');

    loadPhoto();
    resetSlider();
}

function loadPhoto() {
    const photoElement = document.getElementById('photo');
    if (currentPhotos.length > 0) {
        photoElement.src = currentPhotos[0].photo;
        photoElement.alt = currentPhotos[0].name;
    } else {
        photoElement.src = "";
        photoElement.alt = "Fotoğraf yüklenemedi";
    }
}

function updateSliderColor(slider, value) {
    const percent = ((value - slider.min) / (slider.max - slider.min)) * 100;
    const color = currentCategory === 'women' ? 'var(--primary-women)' : 'var(--primary-men)';
    
    slider.style.background = `linear-gradient(to right, 
        ${color} 0%, 
        ${color} ${percent}%, 
        #e0e0e0 ${percent}%, 
        #e0e0e0 100%
    )`;
}

function resetSlider() {
    const slider = document.getElementById('ratingSlider');
    const sliderValue = document.getElementById('sliderValue');
    if (slider && sliderValue) {
        slider.value = 5;
        sliderValue.textContent = "5";
        updateSliderColor(slider, 5);
    }
}

function returnToWelcome() {
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('welcomeScreen').style.display = 'flex';
    document.body.classList.remove('women-theme', 'men-theme');
    resetSlider();
    
    currentCategory = '';
    currentPhotos = [];
}

// Slider'ı başlangıçta da güncelle
document.addEventListener('DOMContentLoaded', () => {
    const slider = document.getElementById('ratingSlider');
    if (slider) {
        updateSliderColor(slider, slider.value);
    }
}); 