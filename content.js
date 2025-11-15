document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('contentBtn');
    if (btn) {
        btn.addEventListener('click', () => {
            // Example interaction
            alert('Content button clicked');
        });
    }
});
