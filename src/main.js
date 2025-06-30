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

// === 自定義物件控制面板 ===
const classNames = [
    "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck",
    "boat", "traffic light", "fire hydrant", "stop sign", "parking meter", "bench",
    "bird", "cat", "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra",
    "giraffe", "backpack", "umbrella", "handbag", "tie", "suitcase", "frisbee",
    "skis", "snowboard", "sports ball", "kite", "baseball bat", "baseball glove",
    "skateboard", "surfboard", "tennis racket", "bottle", "wine glass", "cup", "fork",
    "knife", "spoon", "bowl", "banana", "apple", "sandwich", "orange", "broccoli",
    "carrot", "hot dog", "pizza", "donut", "cake", "chair", "couch", "potted plant",
    "bed", "dining table", "toilet", "tv", "laptop", "mouse", "remote", "keyboard",
    "cell phone", "microwave", "oven", "toaster", "sink", "refrigerator", "book",
    "clock", "vase", "scissors", "teddy bear", "hair drier", "toothbrush"
];

function renderObjectList() {
    const list = document.getElementById('objectList');
    if (!list) return;
    let html = '';
    for (let i = 0; i < classNames.length; i += 5) {
        html += '<div style="display:flex;flex-direction:row;gap:0.5em;margin-bottom:0.5em;">';
        for (let j = i; j < i + 5 && j < classNames.length; j++) {
            html += `<div class=\"object-item\" style=\"flex:1;min-width:0;\"><label style=\"width:100%;display:inline-block;\"><input type=\"checkbox\" value=\"${classNames[j]}\"> ${classNames[j]}</label></div>`;
        }
        html += '</div>';
    }
    list.innerHTML = html;
}

document.addEventListener('DOMContentLoaded', () => {
    renderObjectList();
    const form = document.getElementById('controlForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const checked = Array.from(document.querySelectorAll('#objectList input[type=checkbox]:checked')).map(cb => cb.value);
            const overlapMode = document.querySelector('input[name="overlapMode"]:checked').value;
            const result = { objects: checked, overlapMode };
            try {
                const res = await fetch('/api/save-control', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(result)
                });
                if (res.ok) {
                    document.getElementById('resultMsg').textContent = '設定已儲存！';
                } else {
                    document.getElementById('resultMsg').textContent = '儲存失敗';
                }
            } catch {
                document.getElementById('resultMsg').textContent = '儲存失敗';
            }
        });
    }
});

setInterval(fetchData, 10000);

window.onload = () => {
    fetchData();
    fetchFilteredData();
    initializeMachineStatusChart();
};
