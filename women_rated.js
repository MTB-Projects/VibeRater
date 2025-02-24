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

// Sayfa yüklendiğinde ratingleri yükle
document.addEventListener('DOMContentLoaded', loadRatings);
