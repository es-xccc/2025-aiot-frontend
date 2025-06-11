async function fetchData() {
    try {
        const response = await fetch('/data');
        const data = await response.text();
        document.getElementById('output').innerText = data;
    } catch (error) {
        console.error('Error fetching data:', error);
        document.getElementById('output').innerText = '無法取得資料';
    }
}

async function fetchFilteredData() {
    try {
        const response = await fetch('/filtered-data');
        const data = await response.json();

        const canvas = document.getElementById('dashboard');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        if (canvas.chartInstance) {
            canvas.chartInstance.destroy();
        }

        const objects = data.reduce((acc, item) => {
            if (!acc[item.name]) {
                acc[item.name] = [];
            }
            acc[item.name].push({
                x: (item.x1 + item.x2) / 2,
                y: (item.y1 + item.y2) / 2
            });
            return acc;
        }, {});

        const datasets = Object.keys(objects).map(name => ({
            label: name,
            data: objects[name],
            borderColor: getRandomColor(),
            backgroundColor: getRandomColor(),
            tension: 0.1,
            fill: false,
            pointRadius: 4,
            pointBackgroundColor: 'white',
            pointBorderWidth: 2,
        }));

        canvas.chartInstance = new Chart(ctx, {
            type: 'line',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        type: 'linear',
                        position: 'bottom',
                        grid: { display: false },
                        title: { display: true, text: 'X Coordinate' }
                    },
                    y: {
                        type: 'linear',
                        grid: { color: '#e0e0e0', borderDash: [2,3] },
                        title: { display: true, text: 'Y Coordinate' }
                    }
                },
                plugins: {
                    legend: { position: 'top' },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error fetching filtered data:', error);
    }
}

function getRandomColor() {
    const r = Math.floor(Math.random() * 150 + 50);
    const g = Math.floor(Math.random() * 150 + 50);
    const b = Math.floor(Math.random() * 150 + 50);
    return `rgb(${r},${g},${b})`;
}

function initializeMachineStatusChart() {
    const canvas = document.getElementById('machine-status');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    if (canvas.chartInstance) {
        canvas.chartInstance.destroy();
    }

    canvas.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: '機台控制狀態',
                data: [],
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                fill: true,
                tension: 0.1,
                pointRadius: 3,
                pointBackgroundColor: 'rgba(75, 192, 192, 1)',
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'top' }
            },
            scales: {
                x: {
                    title: { display: true, text: '時間' },
                    grid: { display: false }
                },
                y: {
                    title: { display: true, text: '狀態值' },
                    grid: { color: '#e0e0e0', borderDash: [2,3] }
                }
            }
        }
    });
}

setInterval(fetchData, 10000);

window.onload = () => {
    fetchData();
    fetchFilteredData();
    initializeMachineStatusChart();
};
