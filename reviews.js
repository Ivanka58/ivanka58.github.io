// reviews.js — полностью рабочий прототип (пока на localStorage)

window.ReviewsAPI = {
    // Загрузка отзывов из localStorage
    fetchReviews() {
        const stored = localStorage.getItem('site_reviews');
        if (stored) {
            return JSON.parse(stored);
        }
        // Стартовые примеры
        return [
            {
                id: 1,
                username: 'Алексей',
                rating: 5,
                comment: 'Заказывали техническую воду для стройки. Привезли быстро, вода чистая, без запаха. Спасибо!',
                created_at: new Date().toISOString(),
                user_ip: 'example'
            },
            {
                id: 2,
                username: 'Марина',
                rating: 4,
                comment: 'Пользуюсь второй месяц. Всё устраивает, доставка вовремя.',
                created_at: new Date(Date.now() - 86400000).toISOString(),
                user_ip: 'example2'
            }
        ];
    },
    
    // Сохранение отзывов в localStorage
    saveReviews(reviews) {
        localStorage.setItem('site_reviews', JSON.stringify(reviews));
    },
    
    // Добавление отзыва
    addReview(username, rating, comment) {
        const reviews = this.fetchReviews();
        const newReview = {
            id: Date.now(),
            username: username.trim(),
            rating: rating,
            comment: comment?.trim() || '',
            created_at: new Date().toISOString(),
            user_ip: 'current_user'
        };
        reviews.unshift(newReview);
        this.saveReviews(reviews);
        return { success: true, data: newReview };
    },
    
    // Удаление отзыва (только "текущий пользователь" может удалить)
    deleteReview(reviewId) {
        let reviews = this.fetchReviews();
        const review = reviews.find(r => r.id == reviewId);
        if (!review) return { success: false, error: 'Отзыв не найден' };
        if (review.user_ip !== 'current_user') return { success: false, error: 'Можно удалять только свои отзывы' };
        
        reviews = reviews.filter(r => r.id != reviewId);
        this.saveReviews(reviews);
        return { success: true };
    }
};

// === Отрисовка списка отзывов ===
async function loadReviews() {
    const container = document.getElementById('reviewsList');
    if (!container) return;
    
    const reviews = window.ReviewsAPI.fetchReviews();
    
    if (!reviews || reviews.length === 0) {
        container.innerHTML = '<div class="reviews-loading">Пока нет отзывов. Будьте первым!</div>';
        return;
    }
    
    // Определяем, может ли пользователь удалять (для демо — всегда true)
    const canDelete = true;
    
    container.innerHTML = reviews.map(review => {
        const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
        const date = new Date(review.created_at).toLocaleDateString('ru-RU');
        return `
            <div class="review-card" data-id="${review.id}">
                <div class="review-header">
                    <span class="review-name">${escapeHtml(review.username)}</span>
                    <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
                        <span class="review-stars">${stars}</span>
                        <span class="review-date">${date}</span>
                        ${canDelete ? `
                        <button class="review-delete-btn" onclick="deleteReviewHandler(${review.id})" style="background:none; border:none; cursor:pointer; color:#dc2626; font-size:18px;">🗑️</button>
                        ` : ''}
                    </div>
                </div>
                ${review.comment ? `<div class="review-comment">${escapeHtml(review.comment)}</div>` : ''}
            </div>
        `;
    }).join('');
}

window.deleteReviewHandler = async (id) => {
    if (!confirm('Удалить свой отзыв?')) return;
    const result = window.ReviewsAPI.deleteReview(id);
    if (result.success) {
        await loadReviews();
        showToast('Отзыв удалён', 'success');
    } else {
        showToast(result.error || 'Ошибка', 'error');
    }
};

function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
        color: white;
        padding: 12px 24px;
        border-radius: 50px;
        z-index: 1000;
        font-weight: 600;
    `;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function setupReviewForm() {
    const form = document.getElementById('reviewForm');
    if (!form) return;
    
    let selectedRating = 0;
    const stars = document.querySelectorAll('.star-rating span');
    const ratingError = document.getElementById('ratingError');
    const nameInput = document.getElementById('reviewName');
    const nameError = document.getElementById('nameError');
    
    // Обработка звёзд
    stars.forEach(star => {
        // Клик — выбор рейтинга
        star.addEventListener('click', () => {
            selectedRating = parseInt(star.dataset.value);
            updateStars(selectedRating);
            if (ratingError) ratingError.classList.remove('show');
        });
        
        // Наведение
        star.addEventListener('mouseenter', () => {
            const val = parseInt(star.dataset.value);
            stars.forEach((s, i) => {
                s.textContent = i < val ? '★' : '☆';
            });
        });
        
        star.addEventListener('mouseleave', () => {
            updateStars(selectedRating);
        });
    });
    
    function updateStars(rating) {
        stars.forEach((star, idx) => {
            star.textContent = idx < rating ? '★' : '☆';
        });
    }
    
    // Отправка формы
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        let isValid = true;
        
        const name = nameInput.value.trim();
        if (!name) {
            nameError.classList.add('show');
            nameInput.classList.add('error');
            isValid = false;
        } else {
            nameError.classList.remove('show');
            nameInput.classList.remove('error');
        }
        
        if (selectedRating === 0) {
            ratingError.classList.add('show');
            isValid = false;
        } else {
            ratingError.classList.remove('show');
        }
        
        if (!isValid) return;
        
        const comment = document.getElementById('reviewComment').value;
        const result = window.ReviewsAPI.addReview(name, selectedRating, comment);
        
        if (result.success) {
            form.reset();
            selectedRating = 0;
            updateStars(0);
            showToast('Спасибо за отзыв!', 'success');
            await loadReviews();
        } else {
            showToast('Ошибка', 'error');
        }
    });
}

// Запуск при загрузке
document.addEventListener('DOMContentLoaded', () => {
    setupReviewForm();
    loadReviews();
});
