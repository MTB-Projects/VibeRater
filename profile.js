// Base URL
const BASE_URL = 'https://vibrater.umuttopalak.com';

// API URLs
const API_URL = {
    PROFILE: `${BASE_URL}/profile/`,
    USER_PHOTOS: `${BASE_URL}/profile/photos`,
    RATED_PHOTOS: `${BASE_URL}/profile/rated`,
    UPLOAD_PROFILE_PHOTO: `${BASE_URL}/profile/photo`,
    UPLOAD_PHOTO: `${BASE_URL}/items/upload`,
    DELETE_PHOTO: `${BASE_URL}/profile/delete-photo`
};

// API Headers
function getHeaders() {
    const token = localStorage.getItem('token');
    console.log('Token:', token);
    
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
}

// Profil bilgilerini yükle ve göster
async function loadProfile() {
    try {
        const headers = getHeaders();
        if (!headers) return;

        const response = await fetch(API_URL.PROFILE, {
            method: 'GET',
            headers: headers
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        // Profil bilgilerini göster
        displayProfile(data);
        
        // Kullanıcının fotoğraflarını göster
        displayPhotos(data.images, 'userPhotos');
        
        // Kullanıcının oyladığı fotoğrafları göster
        displayRatedPhotos(data.votes.map(vote => ({
            image_url: vote.item.image_url,
            username: vote.item.title,
            gender: vote.item.gender === 'male' ? 'MALE' : 'FEMALE',
            rating: vote.rating,
            rated_at: vote.created_at
        })), 'ratedPhotos');

    } catch (error) {
        console.error('Profil yükleme hatası:', error);
        if (error.message.includes('401')) {
            localStorage.removeItem('token');
            window.location.href = '/login.html';
        }
    }
}

// Profil bilgilerini göster
function displayProfile(profile) {
    document.getElementById('username').textContent = profile.username;
    document.getElementById('gender').textContent = profile.gender === 'male' ? 'Erkek' : 'Kadın';
    
    // Profil fotoğrafını güncelle
    const profileImage = document.getElementById('profileImage');
    if (profile.profile_photo_url) {
        profileImage.src = profile.profile_photo_url;
    } else {
        profileImage.src = 'default-avatar.png'; // Varsayılan profil fotoğrafı
    }
}

// Tab değiştirme işlevi
function switchTab(tabName) {
    // Tab butonlarını güncelle
    document.querySelectorAll('.tab-button').forEach(button => {
        if (button.dataset.tab === tabName) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });

    // Tab içeriklerini güncelle
    document.querySelectorAll('.tab-pane').forEach(pane => {
        if (pane.id === `${tabName}Tab`) {
            pane.style.opacity = '0';
            pane.classList.add('active');
            setTimeout(() => {
                pane.style.opacity = '1';
            }, 50);
        } else {
            pane.classList.remove('active');
        }
    });
}

// Fotoğrafları görüntüle
function displayPhotos(photos, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    photos.forEach(photo => {
        const photoElement = document.createElement('div');
        photoElement.className = 'photo-item';
        photoElement.innerHTML = `
            <img src="${photo.image_url}" alt="${photo.title}">
            <div class="delete-photo" onclick="deletePhoto('${photo.id}')">✖</div>
        `;
        container.appendChild(photoElement);
    });
}

// Oylanmış fotoğrafları görüntüle
function displayRatedPhotos(photos, containerId) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';

    photos.forEach(photo => {
        const photoElement = document.createElement('div');
        photoElement.className = 'rated-item';
        photoElement.innerHTML = `
            <div class="photo-item">
                <img src="${photo.image_url}" alt="Oylanmış fotoğraf">
                <div class="rating-info">
                    <div class="user-info">
                        <span class="username">${photo.username}</span>
                        <span class="gender-icon">${photo.gender === 'MALE' ? '👨' : '👩'}</span>
                    </div>
                    <div class="rating-score">
                        <span class="score">${photo.rating}/10</span>
                        <span class="rate-date">${formatDate(photo.rated_at)}</span>
                    </div>
                </div>
            </div>
        `;
        container.appendChild(photoElement);
    });
}

// Tarih formatı için yardımcı fonksiyon
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('tr-TR', options);
}

// Profil fotoğrafı yükleme
document.getElementById('profilePhotoInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) {
        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(API_URL.UPLOAD_PROFILE_PHOTO, {
                method: 'POST',
                headers: {
                    'Authorization': getHeaders().Authorization,
                    'accept': 'application/json'
                },
                body: formData
            });

            if (!response.ok) throw new Error('Profil fotoğrafı yükleme başarısız');

            // Profil bilgilerini yeniden yükle
            await loadProfile(); // await ekledik
            
            // Sayfayı yenile
            window.location.reload();
        } catch (error) {
            console.error('Profil fotoğrafı yükleme hatası:', error);
            alert('Profil fotoğrafı yüklenirken bir hata oluştu');
        }
    }
});

// Fotoğraf yükleme
document.getElementById('photoUploadInput').addEventListener('change', async (e) => {
    const files = e.target.files;
    if (files.length > 0) {
        try {
            const headers = getHeaders();
            if (!headers) return;

            for (let file of files) {
                const formData = new FormData();
                formData.append('file', file);

                const response = await fetch(API_URL.UPLOAD_PHOTO, {
                    method: 'POST',
                    headers: {
                        'Authorization': headers.Authorization,
                        'accept': 'application/json'
                    },
                    body: formData
                });

                if (response.status === 401) {
                    localStorage.removeItem('token');
                    window.location.href = '/login.html';
                    return;
                }

                if (!response.ok) throw new Error('Fotoğraf yükleme başarısız');
            }
            
            // Profil bilgilerini yeniden yükle
            await loadProfile();
        } catch (error) {
            console.error('Fotoğraf yükleme hatası:', error);
            alert('Fotoğraf yüklenirken bir hata oluştu');
        }
    }
});

// Fotoğraf silme fonksiyonu
async function deletePhoto(photoId) {
    try {
        const response = await fetch(`${API_URL.DELETE_PHOTO}/${photoId}`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        if (!response.ok) throw new Error('Fotoğraf silme başarısız');

        // Fotoğrafları yeniden yükle
        loadProfile();
    } catch (error) {
        console.error('Fotoğraf silme hatası:', error);
        alert('Fotoğraf silinirken bir hata oluştu');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadProfile(); // Tek bir istek ile tüm verileri yükle
    
    // Tab click olaylarını dinle
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            switchTab(button.dataset.tab);
        });
    });
}); 