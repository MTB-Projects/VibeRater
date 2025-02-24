// Fotoğraf URL'lerini içeren diziler (örnek)
const womenPhotos = [
    "https://example.com/women1.jpg",
    "https://example.com/women2.jpg",
    "https://example.com/women3.jpg"
    // Diğer kadın fotoğraflarını buraya ekleyebilirsiniz
];

const menPhotos = [
    "https://example.com/men1.jpg",
    "https://example.com/men2.jpg",
    "https://example.com/men3.jpg"
    // Diğer erkek fotoğraflarını buraya ekleyebilirsiniz
];

let currentPhotos = []; // Görüntülenecek fotoğrafları tutacak dizi
let currentIndex = 0;   // Şu anki fotoğrafın index'i

// Kategoriyi yüklemek için fonksiyon
function loadCategory(category) {
    const body = document.querySelector('body');
    const titleContainer = document.querySelector('.title-container'); // Title container'ı seçiyoruz

    // Temayı sıfırlama
    resetTheme(body, titleContainer);

    // Kadınlar veya erkekler teması ekleme
    if (category === 'women') {
        setTheme(body, titleContainer, 'women');
        currentPhotos = womenPhotos; // Kadın fotoğrafları dizisini seç
    } else if (category === 'men') {
        setTheme(body, titleContainer, 'men');
        currentPhotos = menPhotos; // Erkek fotoğrafları dizisini seç
    }

    // Fotoğrafı yükle
    currentIndex = 0;  // Başlangıç olarak ilk fotoğraf
    loadPhoto();
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
        photoElement.src = currentPhotos[currentIndex];
        photoElement.alt = "Yeni Fotoğraf Yükleniyor";  // Fotoğraf yüklenirken gösterilecek metin
    } else {
        photoElement.src = "";  // Fotoğraflar bitince boş bırak
        photoElement.alt = "Fotoğraf Bitmiş";  // Fotoğraf bitmişse bu mesajı göster
    }
}

// Fotoğrafı oylamak için fonksiyon
function ratePhoto(rating) {
    console.log(`Fotoğraf ${currentIndex + 1} oylandı. Puan: ${rating}`);
    currentIndex++;

    // Yeni fotoğrafı yükle
    loadPhoto();
}
