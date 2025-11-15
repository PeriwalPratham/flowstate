document.addEventListener('DOMContentLoaded', () => {
    // Populate demo stats
    const statA = document.getElementById('statA');
    const statB = document.getElementById('statB');
    if (statA) statA.textContent = '42';
    if (statB) statB.textContent = '7';
    console.log('Stats initialized');
});
