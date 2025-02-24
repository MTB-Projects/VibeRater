// Fotoğraf ve kişi bilgilerini içeren diziler
const womenPhotos = [
    {
        id: 'w1',
        name: 'Merve',
        photo: "https://example.com/merve.jpg",
        ratings: [], // Örnek: [7, 5] - Tüm kullanıcıların verdiği puanlar
        totalRating: 0, // Toplam puan
        averageRating: 0, // Ortalama puan
        voteCount: 0 // Oy sayısı
    },
    {
        id: 'w2',
        name: 'Ayşe',
        photo: "https://example.com/ayse.jpg",
        ratings: [], // Örnek: [3, 6]
        totalRating: 0,
        averageRating: 0,
        voteCount: 0
    },
    {
        id: 'w3',
        name: 'Hatice',
        photo: "https://example.com/hatice.jpg",
        ratings: [], // Örnek: [9, 9]
        totalRating: 0,
        averageRating: 0,
        voteCount: 0
    }
    // Diğer kadınlar...
];

const menPhotos = [
    {
        id: 'm1',
        name: 'Brad Pitt',
        photo: "https://example.com/men1.jpg",
        ratings: [],
        averageRating: 0
    },
    {
        id: 'm2',
        name: 'Chris Hemsworth',
        photo: "https://example.com/men2.jpg",
        ratings: [],
        averageRating: 0
    }
    // Diğer erkekler...
];

let currentPhotos = [];
let currentIndex = 0;
let currentCategory = '';

// LocalStorage fonksiyonları
function saveRatings() {
    localStorage.setItem('womenRatings', JSON.stringify(womenPhotos));
    localStorage.setItem('menRatings', JSON.stringify(menPhotos));
}

function loadRatings() {
    const savedWomen = localStorage.getItem('womenRatings');
    const savedMen = localStorage.getItem('menRatings');
    
    if (savedWomen) {
        const parsedWomen = JSON.parse(savedWomen);
        womenPhotos.forEach((woman, index) => {
            if (parsedWomen[index]) {
                woman.ratings = parsedWomen[index].ratings;
                woman.totalRating = parsedWomen[index].totalRating;
                woman.voteCount = parsedWomen[index].voteCount;
                woman.averageRating = parsedWomen[index].averageRating;
            }
        });
    }
    
    if (savedMen) {
        const parsedMen = JSON.parse(savedMen);
        menPhotos.forEach((man, index) => {
            if (parsedMen[index]) {
                man.ratings = parsedMen[index].ratings;
                man.averageRating = parsedMen[index].averageRating;
            }
        });
    }
}

// Kategoriyi yüklemek için fonksiyon
function loadCategory(category) {
    // Welcome screen'i gizle
    document.getElementById('welcomeScreen').style.display = 'none';
    // Main content'i göster
    document.getElementById('mainContent').style.display = 'flex';

    const body = document.querySelector('body');
    const titleContainer = document.querySelector('.title-container');
    const menBtn = document.getElementById('men-btn');
    const womenBtn = document.getElementById('women-btn');

    // Temayı sıfırlama
    resetTheme(body, titleContainer);

    // Butonları sıfırlama
    menBtn.classList.remove('active', 'inactive');
    womenBtn.classList.remove('active', 'inactive');

    // Kadınlar veya erkekler teması ekleme
    if (category === 'women') {
        setTheme(body, titleContainer, 'women');
        womenBtn.classList.add('active');
        menBtn.classList.add('inactive');
        currentPhotos = womenPhotos;
    } else if (category === 'men') {
        setTheme(body, titleContainer, 'men');
        menBtn.classList.add('active');
        womenBtn.classList.add('inactive');
        currentPhotos = menPhotos;
    }

    // Fotoğrafı yükle
    currentIndex = 0;
    loadPhoto();

    // Slider'ı varsayılan değere resetle
    const slider = document.getElementById('ratingSlider');
    const sliderValue = document.getElementById('sliderValue');
    if (slider && sliderValue) {
        slider.value = 5;
        sliderValue.textContent = "5";
        
        // Kategori kontrolü
        if (category === 'women') {
            slider.style.background = `linear-gradient(to right, #D91656 50%, #e0e0e0 50%)`;
        } else {
            slider.style.background = `linear-gradient(to right, #45a049 50%, #e0e0e0 50%)`;
        }
    }
    
    currentCategory = category;
}

// Tema sıfırlama
function resetTheme(body, titleContainer) {
    body.classList.remove('women-theme', 'men-theme');
    titleContainer.classList.remove('men-title', 'women-title'); // Önceki renkleri sıfırlıyoruz
}

// Tema ekleme
function setTheme(body, titleContainer, category) {
    if (category === 'women') {
        body.classList.add('women-theme');
        titleContainer.classList.add('women-title'); // Kadın kategorisi seçildiğinde renk ekle
    } else if (category === 'men') {
        body.classList.add('men-theme');
        titleContainer.classList.add('men-title'); // Erkek kategorisi seçildiğinde yazıyı mavi yap
    }
}

// Fotoğrafı yükleme fonksiyonu
function loadPhoto() {
    const photoElement = document.getElementById('photo');
    
    // Eğer fotoğraflar bitmediyse fotoğrafı güncelle
    if (currentIndex < currentPhotos.length) {
        photoElement.src = currentPhotos[currentIndex].photo;
        photoElement.alt = currentPhotos[currentIndex].name;  // Fotoğraf yüklenirken gösterilecek metin
    } else {
        photoElement.src = "";  // Fotoğraflar bitince boş bırak
        photoElement.alt = "Fotoğraf Bitmiş";  // Fotoğraf bitmişse bu mesajı göster
    }
}

function calculateAverageRating(ratings) {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((a, b) => a + b, 0);
    return (sum / ratings.length).toFixed(1);
}

// Fotoğrafı oylamak için fonksiyon
function ratePhoto(rating) {
    const currentPerson = currentPhotos[currentIndex];
    currentPerson.ratings.push(rating);
    currentPerson.totalRating = currentPerson.ratings.reduce((a, b) => a + b, 0);
    currentPerson.voteCount = currentPerson.ratings.length;
    currentPerson.averageRating = (currentPerson.totalRating / currentPerson.voteCount).toFixed(1);
    
    saveRatings();
    currentIndex++;
    loadPhoto();
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', function() {
    // Welcome screen'i göster
    document.getElementById('welcomeScreen').style.display = 'flex';
    // Main content'i gizle
    document.getElementById('mainContent').style.display = 'none';
    
    // ... mevcut DOMContentLoaded kodları ...
});

// Slider değerini güncellemek için yeni fonksiyon
document.addEventListener('DOMContentLoaded', function() {
    const slider = document.getElementById('ratingSlider');
    const sliderValue = document.getElementById('sliderValue');
    
    slider.addEventListener('input', function() {
        sliderValue.textContent = this.value;
        
        // Slider değerine göre renk değişimi
        const value = (this.value - this.min) / (this.max - this.min) * 100;
        
        // Kategori kontrolü
        if (currentCategory === 'women') {
            this.style.background = `linear-gradient(to right, #D91656 ${value}%, #e0e0e0 ${value}%)`;
        } else {
            this.style.background = `linear-gradient(to right, #45a049 ${value}%, #e0e0e0 ${value}%)`;
        }
        
        // Değer göstergesinin pozisyonunu güncelle
        const thumbPosition = (value / 100) * (this.offsetWidth - 25);
        sliderValue.style.left = `${thumbPosition + 12.5}px`;
    });
});
