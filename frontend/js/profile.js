function requireAuthProfile() {
    const user = getCurrentUser();
    if (!user || !user._id) {
        showAlert('Please login to view your profile.', 'info');
        setTimeout(() => {
            window.location.href = 'login.html?next=profile.html';
        }, 700);
        return null;
    }
    return user;
}

function fillProfileForm(user) {
    document.getElementById('profileName').value = user.name || '';
    document.getElementById('profileEmail').value = user.email || '';

    const address = user.address || {};
    document.getElementById('profileStreet').value = address.street || '';
    document.getElementById('profileCity').value = address.city || '';
    document.getElementById('profileState').value = address.state || '';
    document.getElementById('profileZip').value = address.zipCode || '';
    document.getElementById('profileCountry').value = address.country || '';
}

async function loadProfile() {
    const user = requireAuthProfile();
    if (!user) return;

    try {
        const response = await fetch(`${API_ENDPOINTS.users}/profile/${user._id}`);
        const profile = await response.json();

        if (!response.ok) {
            throw new Error(profile.message || 'Unable to load profile');
        }

        fillProfileForm(profile);
    } catch (error) {
        showAlert('Unable to load profile details.', 'error');
    }
}

async function saveProfile(e) {
    e.preventDefault();
    const user = requireAuthProfile();
    if (!user) return;

    const payload = {
        name: document.getElementById('profileName').value.trim(),
        email: document.getElementById('profileEmail').value.trim(),
        address: {
            street: document.getElementById('profileStreet').value.trim(),
            city: document.getElementById('profileCity').value.trim(),
            state: document.getElementById('profileState').value.trim(),
            zipCode: document.getElementById('profileZip').value.trim(),
            country: document.getElementById('profileCountry').value.trim(),
        },
    };

    const password = document.getElementById('profilePassword').value.trim();
    if (password) {
        payload.password = password;
    }

    try {
        const response = await fetch(`${API_ENDPOINTS.users}/profile/${user._id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const updated = await response.json();
        if (!response.ok) {
            throw new Error(updated.message || 'Unable to save profile');
        }

        saveUser(updated);
        showAlert('Profile updated successfully.', 'success');
        document.getElementById('profilePassword').value = '';
    } catch (error) {
        showAlert(error.message || 'Unable to save profile.', 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    const form = document.getElementById('profileForm');
    if (form) {
        form.addEventListener('submit', saveProfile);
    }
});
