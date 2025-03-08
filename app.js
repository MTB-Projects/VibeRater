// API URLs
const API_URL = {
    RANDOM: 'https://viberater.umuttopalak.com/items/random',
    RANDOM_FALLBACK: 'https://viberater.umuttopalak.com/items/sample', // Yedek endpoint (aynı domainde farklı bir yol)
    VOTE: 'https://viberater.umuttopalak.com/votes/vote',
    RATINGS: 'https://viberater.umuttopalak.com/items/ratings'
};

// Yedek statik veri (API çalışmadığında gösterilecek)
const FALLBACK_DATA = {
    MALE: [
        {
            id: "demo_male_1",
            image_url: "https://images.unsplash.com/photo-1557862921-37829c790f19?w=800&auto=format&fit=crop",
            title: "Demo Kullanıcı - Erkek",
            description: "Demo içerik"
        },
        {
            id: "demo_male_2",
            image_url: "https://images.unsplash.com/photo-1564564321837-a57b7070ac4f?w=800&auto=format&fit=crop",
            title: "Demo Kullanıcı - Erkek 2",
            description: "Demo içerik"
        }
    ],
    FEMALE: [
        {
            id: "demo_female_1",
            image_url: "https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=800&auto=format&fit=crop",
            title: "Demo Kullanıcı - Kadın",
            description: "Demo içerik"
        },
        {
            id: "demo_female_2",
            image_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=800&auto=format&fit=crop",
            title: "Demo Kullanıcı - Kadın 2",
            description: "Demo içerik"
        }
    ]
};

// Global değişkenler
let currentPhotos = [];
let currentCategory = '';
let retryCount = 0;  // Yeniden deneme sayacı
let lastPhotoId = null;  // Son gelen fotoğrafın ID'si
const MAX_RETRIES = 3;  // Maksimum yeniden deneme sayısı

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
        const photoContainer = document.querySelector('.photo-container');
        
        if (!photoContainer) return;
        
        // Yükleniyor göstergesi ekle
        if (!document.getElementById('loading-indicator')) {
            const loadingIndicator = document.createElement('div');
            loadingIndicator.id = 'loading-indicator';
            loadingIndicator.style.cssText = 'position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); display: none;';
            loadingIndicator.innerHTML = `
                <div style="text-align: center;">
                    <div style="width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid var(--primary-men); border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
                    <p style="margin-top: 10px; color: #666;">Fotoğraf yükleniyor...</p>
                </div>
            `;
            photoContainer.appendChild(loadingIndicator);
            
            // Animasyon için CSS ekle
            if (!document.getElementById('loading-animation-style')) {
                const style = document.createElement('style');
                style.id = 'loading-animation-style';
                style.textContent = `
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `;
                document.head.appendChild(style);
            }
        }
        
        const loadingIndicator = document.getElementById('loading-indicator');
        
        if (photoData) {
            // Yükleniyor göstergesini göster
            loadingIndicator.style.display = 'block';
            this.elements.photo.style.opacity = '0';
            
            // Eğer bir önceki yüklemeden kalan bir yükleme varsa iptal et
            if (this.elements.photo.loadTimeout) {
                clearTimeout(this.elements.photo.loadTimeout);
            }
            
            // Kategoriye uygun border rengi (opsiyonel görsel iyileştirme)
            const borderColor = currentCategory === 'FEMALE' ? 
                'var(--primary-women)' : 'var(--primary-men)';
            this.elements.photo.style.borderColor = borderColor;
            
            // Fotoğraf URL'sini güncelle
            this.elements.photo.src = photoData.photo;
            this.elements.photo.alt = photoData.name || 'Fotoğraf';
            
            // Fotoğraf yüklendiğinde
            this.elements.photo.onload = () => {
                // Yükleniyor göstergesini gizle
                loadingIndicator.style.display = 'none';
                
                // Fotoğrafı göster (smooth animation)
                requestAnimationFrame(() => {
                    this.elements.photo.style.opacity = '1';
                    this.elements.photo.style.transition = 'opacity 0.3s ease';
                });
            };
            
            // Fotoğraf yüklenemezse
            this.elements.photo.onerror = () => {
                console.error('Fotoğraf yüklenemedi, yeni fotoğraf isteniyor...');
                loadingIndicator.style.display = 'none';
                
                // 5 saniye içinde yüklenmezse timeout ile yeni fotoğraf iste
                this.elements.photo.loadTimeout = setTimeout(() => fetchPhoto(), 500);
            };
        } else {
            // Yükleniyor göstergesini gizle
            loadingIndicator.style.display = 'none';
            // Hata durumunda fotoğrafı temizle
            this.elements.photo.src = '';
            this.elements.photo.alt = 'Fotoğraf yüklenemedi';
            this.elements.photo.style.opacity = '1';
        }
    }
};

// API yollarını kontrol etme ve düzeltme fonksiyonu
let isApiHealthChecked = false;
let useApiHealthCheck = false; // API sağlık kontrolünü açıp kapatmak için flag
let forceFallbackMode = false; // Yedek modu zorla kullanmak için flag (API 404'lerde kullanılabilir)

// API sağlık kontrolü fonksiyonu
async function checkApiHealth() {
    // API sağlık kontrolü zaten yapıldıysa tekrar yapma
    if (isApiHealthChecked) return;
    
    // API sağlık kontrolü kapalıysa bir şey yapma
    if (!useApiHealthCheck) {
        isApiHealthChecked = true;
        return;
    }
    
    try {
        console.log("API sağlık kontrolü yapılıyor...");
        
        // API endpoint'ine istek gönder
        const response = await fetch(`${API_URL.RANDOM}?health_check=true`, {
            method: 'GET',
            headers: getHeaders(),
            // Kısa timeout ile hızlı kontrol
            signal: AbortSignal.timeout(3000)
        });
        
        // API durumunu kontrol et
        if (response.status === 404) {
            console.warn("API sağlık kontrolü: 404 - Endpoint bulunamadı");
            forceFallbackMode = true;
        } else if (!response.ok) {
            console.warn(`API sağlık kontrolü: ${response.status} - API yanıt veriyor ama hata döndürüyor`);
        } else {
            console.log("API sağlık kontrolü: Başarılı ✓");
        }
    } catch (error) {
        console.warn("API sağlık kontrolü başarısız:", error.message);
        
        // Timeout veya ağ hatası durumunda fallback modu etkinleştir
        if (error.name === 'AbortError' || error.name === 'TypeError') {
            console.warn("API yanıt vermiyor, fallback modu etkinleştiriliyor");
            forceFallbackMode = true;
        }
    } finally {
        // Kontrolü bir kere yaptık, tekrar yapmayalım
        isApiHealthChecked = true;
    }
}

// Alternatif veri kaynağını kullan
function getRandomFallbackData() {
    try {
        // Kategoriye göre uygun verileri seç
        const categoryData = currentCategory === 'MALE' ? 
            FALLBACK_DATA.MALE : FALLBACK_DATA.FEMALE;
            
        // Rastgele bir veri seç
        const randomIndex = Math.floor(Math.random() * categoryData.length);
        return categoryData[randomIndex];
    } catch (error) {
        console.error("Yedek veri yüklenirken hata:", error);
        return null;
    }
}

// Fotoğraf ve oylama işlemleri
async function fetchPhoto(withScreenTransition = false) {
    try {
        // İlk başlangıçta API sağlığını kontrol et
        if (useApiHealthCheck && !isApiHealthChecked) {
            await checkApiHealth();
        }
        
        // Eğer maksimum yeniden deneme sayısına ulaşıldıysa
        if (retryCount >= MAX_RETRIES) {
            console.log(`Maksimum deneme sayısına ulaşıldı (${MAX_RETRIES}). Daha fazla istek yapılmayacak.`);
            
            // Eğer yedek veri kullanılabilirse, bunu kullan
            const fallbackData = getRandomFallbackData();
            if (fallbackData && !forceFallbackMode) {
                console.log("Yedek veri kullanılıyor:", fallbackData);
                
                // Ekran geçişiyle geldiyse, ekranları düzenle
                if (withScreenTransition) {
                    switchToMainContent();
                }
                
                // Fotoğraf yüklendiyse göster
                currentPhotos = [{
                    id: fallbackData.id,
                    photo: fallbackData.image_url,
                    name: fallbackData.title
                }];
                
                UI.updatePhoto(currentPhotos[0]);
                
                // Tam ekran yükleme ekranını kaldır
                hideFullScreenLoader();
                
                // Yedek modu kullanıldığını göster
                showFallbackModeMessage();
                return;
            }
            
            // Yükleniyor göstergesini kapat
            hideFullScreenLoader();
            const loadingIndicator = document.getElementById('loading-indicator');
            if (loadingIndicator) loadingIndicator.style.display = 'none';
            
            // Ekran geçişiyle geldiyse, ekranları düzenle
            if (withScreenTransition) {
                switchToMainContent();
            }
            
            // Kullanıcıya "sunucu hatası" mesajı göster
            showServerErrorMessage();
            return;
        }
        
        // API'ye hiç erişilemiyorsa doğrudan yedek moda geç
        if (forceFallbackMode) {
            console.log("Zorunlu yedek mod aktif, doğrudan yedek veri kullanılıyor");
            
            const fallbackData = getRandomFallbackData();
            if (fallbackData) {
                // Ekran geçişiyle geldiyse, ekranları düzenle
                if (withScreenTransition) {
                    switchToMainContent();
                }
                
                // Fotoğraf yüklendiyse göster
                currentPhotos = [{
                    id: fallbackData.id,
                    photo: fallbackData.image_url,
                    name: fallbackData.title
                }];
                
                UI.updatePhoto(currentPhotos[0]);
                
                // Tam ekran yükleme ekranını kaldır
                hideFullScreenLoader();
                
                // Yedek modu kullanıldığını göster
                showFallbackModeMessage();
                return;
            }
        }
        
        // URL'i konsola yazdıralım ve kontrol edelim
        console.log(`Fetching: ${API_URL.RANDOM}?gender=${currentCategory} (Deneme: ${retryCount + 1}/${MAX_RETRIES})`);
        
        const response = await fetch(`${API_URL.RANDOM}?gender=${currentCategory}`, {
            method: 'GET',
            headers: getHeaders()
        });

        // Response detaylarını görelim
        console.log('Response status:', response.status);

        // 404 hatası durumunda API yolu değişmiş olabilir, yedek içeriğe başvuralım
        if (response.status === 404) {
            console.warn("API endpoint'i bulunamadı (404). Yedek içerik kullanılacak.");
            forceFallbackMode = true;
            retryCount = MAX_RETRIES; // Daha fazla API denemesi yapma
            
            // Yedek içerik için fonksiyonu tekrar çağır
            fetchPhoto(withScreenTransition);
            return;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received data:', data);
        
        // Eğer aynı fotoğraf ID'si tekrar geliyorsa, sayacı artır
        if (lastPhotoId === data.id) {
            retryCount++;
            console.log(`Aynı fotoğraf tekrar geldi. Deneme: ${retryCount}/${MAX_RETRIES}`);
        } else {
            // Farklı bir fotoğraf gelirse sayacı sıfırla
            retryCount = 0;
            lastPhotoId = data.id;
        }

        // Veri kontrolü - boş veya geçersiz URL durumunda
        if (!data || !data.image_url || data.image_url === '' || data.image_url.includes('300x300.jpg') || data.image_url.includes('placeholder')) {
            console.log('Geçersiz fotoğraf URL\'si bulundu.');
            
            // Sayacı artır
            retryCount++;
            
            // Maksimum yeniden deneme sayısına ulaşılmadıysa tekrar dene
            if (retryCount < MAX_RETRIES) {
                console.log(`Yeni fotoğraf isteniyor... (${retryCount}/${MAX_RETRIES})`);
                setTimeout(() => fetchPhoto(withScreenTransition), 500); // Bekleme süresini kısalttım
                return;
            } else {
                console.log(`Maksimum deneme sayısına ulaşıldı (${MAX_RETRIES}). Daha fazla istek yapılmayacak.`);
                
                // Ekran geçişiyle geldiyse, ekranları düzenle
                if (withScreenTransition) {
                    switchToMainContent();
                }
                
                // Yükleniyor göstergesini kaldır
                hideFullScreenLoader();
                
                // Kullanıcıya "fotoğraf bulunamadı" mesajı göster
                showNoPhotosMessage();
                return;
            }
        }

        // URL formatını kontrol et
        try {
            // URL'nin geçerli olduğunu test et
            new URL(data.image_url);
            
            // URL'nin erişilebilir olduğunu kontrol et 
            const imgTest = new Image();
            imgTest.onload = function() {
                // Sayacı sıfırla çünkü başarılı bir yükleme oldu
                retryCount = 0;
                
                // Ekran geçişiyle geldiyse, ekranları düzenle
                if (withScreenTransition) {
                    switchToMainContent();
                }
                
                // Fotoğraf yüklendiyse göster
                currentPhotos = [{
                    id: data.id,
                    photo: data.image_url,
                    name: data.title
                }];
                
                UI.updatePhoto(currentPhotos[0]);
                
                // Tam ekran yükleme ekranını kaldır
                hideFullScreenLoader();
            };
            
            imgTest.onerror = function() {
                console.error('Fotoğraf yüklenemedi.');
                
                // Sayacı artır
                retryCount++;
                
                // Maksimum yeniden deneme sayısına ulaşılmadıysa tekrar dene
                if (retryCount < MAX_RETRIES) {
                    console.log(`Yeni fotoğraf isteniyor... (${retryCount}/${MAX_RETRIES})`);
                    setTimeout(() => fetchPhoto(withScreenTransition), 500);
                } else {
                    console.log(`Maksimum deneme sayısına ulaşıldı (${MAX_RETRIES}). Daha fazla istek yapılmayacak.`);
                    
                    // Ekran geçişiyle geldiyse, ekranları düzenle
                    if (withScreenTransition) {
                        switchToMainContent();
                    }
                    
                    // Yükleniyor göstergesini kaldır
                    hideFullScreenLoader();
                    
                    // Kullanıcıya "fotoğraf bulunamadı" mesajı göster
                    showNoPhotosMessage();
                }
            };
            
            imgTest.src = data.image_url;
            
        } catch (urlError) {
            console.error('Geçersiz URL formatı.');
            
            // Sayacı artır
            retryCount++;
            
            // Maksimum yeniden deneme sayısına ulaşılmadıysa tekrar dene
            if (retryCount < MAX_RETRIES) {
                console.log(`Yeni fotoğraf isteniyor... (${retryCount}/${MAX_RETRIES})`);
                setTimeout(() => fetchPhoto(withScreenTransition), 500);
            } else {
                console.log(`Maksimum deneme sayısına ulaşıldı (${MAX_RETRIES}). Daha fazla istek yapılmayacak.`);
                
                // Ekran geçişiyle geldiyse, ekranları düzenle
                if (withScreenTransition) {
                    switchToMainContent();
                }
                
                // Yükleniyor göstergesini kaldır
                hideFullScreenLoader();
                
                // Kullanıcıya "fotoğraf bulunamadı" mesajı göster
                showNoPhotosMessage();
            }
        }
    } catch (error) {
        console.error('Fotoğraf yükleme hatası:', error);
        currentPhotos = [];
        
        // 404 hatası için yedek moda geç
        if (error.message.includes('404')) {
            console.warn("API 404 hatası, yedek moda geçiliyor");
            forceFallbackMode = true;
            retryCount = MAX_RETRIES; // Daha fazla API denemesi yapma
            
            // Yedek içerik için fonksiyonu tekrar çağır
            fetchPhoto(withScreenTransition);
            return;
        }
        
        // Yükleniyor göstergesini kaldır
        hideFullScreenLoader();
        
        if (error.message.includes('401')) {
            alert('Oturum süreniz dolmuş. Lütfen tekrar giriş yapın.');
            window.location.href = '/login.html';
        } else {
            // Diğer API hataları için tekrar deneme yapmayalım
            if (error.message.includes('404')) {
                console.warn("API endpoint'i bulunamadı (404). Endpoint değişmiş olabilir.");
                
                // Ekranları düzenle
                if (withScreenTransition) {
                    switchToMainContent();
                }
                
                // Sunucu hatası mesajı göster
                showServerErrorMessage();
                return;
            }
            
            // Diğer hatalar için sayacı artır
            retryCount++;
            
            // Ekran geçişiyle geldiyse, ekranları düzenle
            if (withScreenTransition) {
                switchToMainContent();
            }
            
            // Maksimum yeniden deneme sayısına ulaşılmadıysa tekrar dene
            if (retryCount < MAX_RETRIES) {
                console.log(`Yeni fotoğraf isteniyor... (${retryCount}/${MAX_RETRIES})`);
                setTimeout(() => fetchPhoto(withScreenTransition), 500);
            } else {
                console.log(`Maksimum deneme sayısına ulaşıldı (${MAX_RETRIES}). Daha fazla istek yapılmayacak.`);
                
                // Kullanıcıya "sunucu hatası" mesajı göster
                showServerErrorMessage();
            }
        }
    }
}

// Fotoğraf bulunamadığında kullanıcıya gösterilecek mesaj
function showNoPhotosMessage() {
    const photoContainer = document.querySelector('.photo-container');
    if (!photoContainer) return;
    
    // Yükleniyor göstergesini kaldır
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    
    // Fotoğraf alanını temizle
    const photoElement = document.getElementById('photo');
    if (photoElement) photoElement.style.display = 'none';
    
    // Oylama konteynerini gizle
    const ratingContainer = document.querySelector('.rating-container');
    if (ratingContainer) ratingContainer.style.display = 'none';
    
    // Mesaj kutusu oluştur
    const noPhotosMessage = document.createElement('div');
    noPhotosMessage.className = 'no-photos-message';
    noPhotosMessage.innerHTML = `
        <div style="text-align: center; padding: 30px; background: rgba(0,0,0,0.03); border-radius: 12px; margin: 20px;">
            <h3 style="margin-bottom: 10px; color: #555;">Bu kategoride fotoğraf bulunamadı</h3>
            <p style="color: #777; margin-bottom: 20px;">Şu anda oylanacak fotoğraf bulunmamaktadır.</p>
            <button onclick="resetAndReturnToWelcome()" style="background: linear-gradient(135deg, #ff6b6b, #ff4757); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">Ana Sayfaya Dön</button>
        </div>
    `;
    
    // Eğer zaten mesaj varsa yenisini ekleme
    if (!document.querySelector('.no-photos-message')) {
        photoContainer.appendChild(noPhotosMessage);
    }
}

// Ana sayfaya dönüş ve sıfırlama fonksiyonu
function resetAndReturnToWelcome() {
    // Sayacı sıfırla
    retryCount = 0;
    lastPhotoId = null;
    
    // Ana sayfaya dön
    returnToWelcome();
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
    // API sağlık kontrolünü sadece useApiHealthCheck true ise yap
    if (useApiHealthCheck) {
        checkApiHealth();
    }
    
    // Önce DOM'u temizle ve kullanıcı arayüzünü geçişe hazırla
    UI.elements.welcomeScreen.style.opacity = '0';
    UI.elements.welcomeScreen.style.transition = 'opacity 0.2s ease';
    
    // Hata mesajlarını ve önceki yükleme göstergelerini temizle
    document.querySelectorAll('.server-error-message, .no-photos-message').forEach(el => el.remove());
    hideFullScreenLoader();
    
    // Kategori değiştiğinde sayaçları sıfırla
    retryCount = 0;
    lastPhotoId = null;
    
    // Kategoriyi belirle
    currentCategory = category === 'men' ? 'MALE' : 'FEMALE';
    
    // Tema değişikliği
    document.body.classList.add(category === 'men' ? 'men-theme' : 'women-theme');
    document.body.classList.remove(category === 'men' ? 'women-theme' : 'men-theme');
    
    // Kayboluş animasyonu tamamlandığında display'i none yapmalı ve loader'ı göstermeliyiz
    setTimeout(() => {
        // Welcome screen'i tamamen gizle
        UI.elements.welcomeScreen.style.display = 'none';
        
        // Tam ekran yükleyiciyi göster 
        showFullScreenLoader(category);
        
        // Slider'ı sıfırla
        resetSlider();
        
        // Timeout ekleyelim ki uzun süren API çağrılarında kullanıcı takılmasın
        const fetchTimeout = setTimeout(() => {
            console.warn("API çağrısı çok uzun sürdü, otomatik olarak ana ekrana geçiliyor");
            hideFullScreenLoader();
            switchToMainContent();
            showServerErrorMessage();
        }, 8000); // 8 saniye sonra timeout
        
        // Yeni fotoğrafı getirmeyi dene
        fetchPhoto(true).finally(() => {
            // Her durumda timeout'u temizle
            clearTimeout(fetchTimeout);
        });
    }, 200); // 200ms, opacity geçiş süresine eşit
};

window.returnToWelcome = function() {
    // Hızlı geçişler için önce mainContent'i gizle
    UI.elements.mainContent.style.opacity = '0';
    UI.elements.mainContent.style.transition = 'opacity 0.2s ease';
    
    // Tüm hata mesajlarını ve yükleme göstergelerini temizle
    document.querySelectorAll('.server-error-message, .no-photos-message').forEach(el => el.remove());
    hideFullScreenLoader();
    
    // Kısa bir bekleme sonrası ekranları değiştir
    setTimeout(() => {
        // Ana içeriği tamamen gizle
        UI.elements.mainContent.style.display = 'none';
        
        // Welcome screen'i görünür yap ve opacity'i sıfırla (önce opacity:0 ile)
        UI.elements.welcomeScreen.style.display = 'flex';
        UI.elements.welcomeScreen.style.opacity = '0';
        
        // DOM'un güncellenmesi için çok kısa bir bekleme
        setTimeout(() => {
            // Welcome screen'in görünürlüğünü artır
            UI.elements.welcomeScreen.style.opacity = '1';
        }, 10);
        
        // Tema sınıflarını kaldır
        document.body.classList.remove('women-theme', 'men-theme');
        
        // Slider'ı sıfırla
        resetSlider();
        
        // Global değişkenleri sıfırla
        currentCategory = '';
        currentPhotos = [];
        retryCount = 0;
        lastPhotoId = null;
        
        // Varsa tam ekran loader'ı kaldır
        hideFullScreenLoader();
    }, 200);
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

// Tam ekran yükleme göstergesi
function showFullScreenLoader(category = 'men') {
    // Eğer zaten varsa, kaldır ve yeniden oluştur
    const existingLoader = document.getElementById('fullscreen-loader');
    if (existingLoader) existingLoader.remove();

    // Kategoriye uygun rengi belirle (erkekler için mavi, kadınlar için pembe)
    const loaderColor = category === 'men' ? 'var(--primary-men)' : 'var(--primary-women)';
    const bgColor = category === 'men' ? 'rgba(149, 177, 219, 0.1)' : 'rgba(255, 181, 181, 0.1)';
    
    // Kategoriye uygun mesaj (optional)
    const message = category === 'men' ? 'Erkek Fotoğrafları Yükleniyor...' : 'Kadın Fotoğrafları Yükleniyor...';

    const loader = document.createElement('div');
    loader.id = 'fullscreen-loader';
    loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: ${bgColor};
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        backdrop-filter: blur(5px);
        opacity: 0;
        transition: opacity 0.3s ease;
    `;

    loader.innerHTML = `
        <div style="text-align: center;">
            <div style="width: 60px; height: 60px; border: 5px solid rgba(255, 255, 255, 0.3); border-top: 5px solid ${loaderColor}; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
            <p style="margin-top: 20px; color: #333; font-size: 18px; font-weight: 500;">${message}</p>
        </div>
    `;

    document.body.appendChild(loader);
    
    // Animasyon ekle
    if (!document.getElementById('loading-animation-style')) {
        const style = document.createElement('style');
        style.id = 'loading-animation-style';
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
    
    // DOM'un güncellemesini bekleyip sonra opacity'i artır (smoother animation)
    requestAnimationFrame(() => {
        loader.style.opacity = '1';
    });
}

// Tam ekran yükleme göstergesini kaldır
function hideFullScreenLoader() {
    const loader = document.getElementById('fullscreen-loader');
    if (loader) {
        // Animasyonlu geçiş için önce opacity'i azaltalım
        loader.style.opacity = '0';
        loader.style.transition = 'opacity 0.3s ease';
        
        // Sonra tamamen kaldıralım
        setTimeout(() => {
            loader.remove();
        }, 300);
    }
}

// Ana ekrandan oylama ekranına geçişi yapar
function switchToMainContent() {
    // Ekran değişimi için tüm ayarlamaları yap
    UI.elements.welcomeScreen.style.display = 'none';
    UI.elements.mainContent.style.display = 'flex';
    UI.elements.mainContent.style.opacity = '0';
    
    // Fotoğraf elementini yeniden göster (gizlenmişse)
    const photoElement = document.getElementById('photo');
    if (photoElement) photoElement.style.display = 'block';
    
    // Oylama konteynerini yeniden göster (gizlenmişse)
    const ratingContainer = document.querySelector('.rating-container');
    if (ratingContainer) ratingContainer.style.display = 'block';
    
    // İçeriğin görünürlüğünü yavaşça artır (DOM güncellenmesi için bir tick bekle)
    setTimeout(() => {
        UI.elements.mainContent.style.opacity = '1';
        UI.elements.mainContent.style.transition = 'opacity 0.4s ease';
    }, 20);
}

// API sunucu hatası mesajı göster
function showServerErrorMessage() {
    const photoContainer = document.querySelector('.photo-container');
    if (!photoContainer) return;
    
    // Yükleniyor göstergesini kaldır
    const loadingIndicator = document.getElementById('loading-indicator');
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    
    // Fotoğraf alanını temizle
    const photoElement = document.getElementById('photo');
    if (photoElement) photoElement.style.display = 'none';
    
    // Oylama konteynerini gizle
    const ratingContainer = document.querySelector('.rating-container');
    if (ratingContainer) ratingContainer.style.display = 'none';
    
    // Mesaj kutusu oluştur
    const errorMessage = document.createElement('div');
    errorMessage.className = 'server-error-message';
    errorMessage.innerHTML = `
        <div style="text-align: center; padding: 30px; background: rgba(255, 75, 75, 0.1); border-radius: 12px; margin: 20px;">
            <h3 style="margin-bottom: 10px; color: #d63031;">Sunucu Hatası</h3>
            <p style="color: #636e72; margin-bottom: 20px;">Sunucuya erişim sağlanamadı. Lütfen daha sonra tekrar deneyin.</p>
            <div style="color: #636e72; font-size: 12px; background: #f5f5f5; padding: 10px; border-radius: 6px; margin-bottom: 20px; text-align: left;">
                <code>API Yanıtı: 404 - Endpoint bulunamadı.</code>
            </div>
            <button onclick="resetAndReturnToWelcome()" style="background: linear-gradient(135deg, #ff6b6b, #ff4757); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">Ana Sayfaya Dön</button>
        </div>
    `;
    
    // Eğer zaten mesaj varsa yenisini ekleme
    if (!document.querySelector('.server-error-message')) {
        photoContainer.appendChild(errorMessage);
    }
}

// Yedek mod mesajını göster
function showFallbackModeMessage() {
    const container = document.querySelector('.button-container');
    if (!container) return;
    
    // Eğer zaten mesaj gösteriliyorsa çık
    if (document.querySelector('.fallback-mode-indicator')) return;
    
    // Mesaj banner'ı oluştur
    const fallbackMessage = document.createElement('div');
    fallbackMessage.className = 'fallback-mode-indicator';
    fallbackMessage.innerHTML = `
        <div style="background: rgba(255, 159, 67, 0.15); color: #e67e22; padding: 10px; border-radius: 8px; 
                    font-size: 14px; margin-bottom: 15px; text-align: center; width: 100%;">
            ⚠️ Demo Mod - Şu anda örnek veriler gösteriliyor
        </div>
    `;
    
    // Mesajı en üste ekle
    container.insertBefore(fallbackMessage, container.firstChild);
}

// Sayfa yüklendiğinde
document.addEventListener('DOMContentLoaded', () => {
    UI.init();
    fetchStats();
}); 