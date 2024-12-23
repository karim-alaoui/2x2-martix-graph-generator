(function() {

    // --------------------------------------------------
    // DOM References
    // --------------------------------------------------
    const chartSvg         = document.getElementById('chart');
    const downloadBtn      = document.getElementById('downloadBtn');
    const clearAllBtn      = document.getElementById('clearAllBtn');
    const xAxisNameInput   = document.getElementById('xAxisName');
    const yAxisNameInput   = document.getElementById('yAxisName');
    const itemNameInput    = document.getElementById('itemName');
    const itemColorInput   = document.getElementById('itemColor');
    const xValueInput      = document.getElementById('xValue');
    const yValueInput      = document.getElementById('yValue');
    const xRangeValueSpan  = document.getElementById('xRangeValue');
    const yRangeValueSpan  = document.getElementById('yRangeValue');
    const xLabel           = document.getElementById('xLabel');
    const yLabel           = document.getElementById('yLabel');
    const itemsList        = document.getElementById('itemsList');
    const leftLabelInput   = document.getElementById('leftLabel');
    const rightLabelInput  = document.getElementById('rightLabel');
    const topLabelInput    = document.getElementById('topLabel');
    const bottomLabelInput = document.getElementById('bottomLabel');
    const applyAxisBtn     = document.getElementById('applyAxisBtn');
    const addItemBtn       = document.getElementById('addItemBtn');

    // --------------------------------------------------
    // Global State
    // --------------------------------------------------
    let items = [];

    // --------------------------------------------------
    // Local Storage Helpers
    // --------------------------------------------------
    function saveItemsToLocalStorage(itemsArray) {
        localStorage.setItem('myQuadrantItems', JSON.stringify(itemsArray));
    }

    function loadItemsFromLocalStorage() {
        const saved = localStorage.getItem('myQuadrantItems');
        return saved ? JSON.parse(saved) : null;
    }

    // --------------------------------------------------
    // UI/Chart Updates
    // --------------------------------------------------
    function updateRangeValue(input, outputElement) {
        outputElement.textContent = input.value;
    }

    function updateAxisLabelsInUI() {
        xLabel.textContent = xAxisNameInput.value;
        yLabel.textContent = yAxisNameInput.value;
    }

    function mapValueToChartCoord(value) {
        return (value - 50) * 2;
    }

    function updateItemsList() {
        itemsList.innerHTML = items.map(item => `
            <div class="item-entry">
                <span style="color: ${item.color}">${item.name}</span>
                <button class="delete-btn" onclick="deleteItem('${item.id}')">×</button> 
                <!-- NEW/CHANGED: item.id is now a string (UUID). Make sure to quote it. -->
            </div>
        `).join('');
    }

    function updateChart() {
        chartSvg.innerHTML = `
            <line x1="-100" y1="0" x2="100" y2="0" stroke="#00000060" />
            <line x1="0" y1="-100" x2="0" y2="100" stroke="#00000060" />
            <path d="M 95 -5 L 100 0 L 95 5" stroke="#00000060" fill="none" />
            <path d="M -95 -5 L -100 0 L -95 5" stroke="#00000060" fill="none" />
            <path d="M -5 -95 L 0 -100 L 5 -95" stroke="#00000060" fill="none" />
            <path d="M -5 95 L 0 100 L 5 95" stroke="#00000060" fill="none" />
            <text x="-90" y="-10" class="axis-label" text-anchor="end">${leftLabelInput.value}</text>
            <text x="90"  y="-10" class="axis-label" text-anchor="start">${rightLabelInput.value}</text>
            <text x="10"  y="-90" class="axis-label" text-anchor="start">${topLabelInput.value}</text>
            <text x="10"  y="95"  class="axis-label" text-anchor="start">${bottomLabelInput.value}</text>
        `;

        items.forEach(item => {
            const textEl = document.createElementNS("http://www.w3.org/2000/svg", "text");
            textEl.setAttribute('x', mapValueToChartCoord(item.x));
            textEl.setAttribute('y', -mapValueToChartCoord(item.y));
            textEl.setAttribute('text-anchor', 'middle');
            textEl.setAttribute('class', 'item-label');
            textEl.setAttribute('fill', item.color);
            textEl.textContent = item.name;
            chartSvg.appendChild(textEl);
        });
    }

    // --------------------------------------------------
    // Event Handlers
    // --------------------------------------------------
    xValueInput.addEventListener('input', () => updateRangeValue(xValueInput, xRangeValueSpan));
    yValueInput.addEventListener('input', () => updateRangeValue(yValueInput, yRangeValueSpan));

    xAxisNameInput.addEventListener('change', updateAxisLabelsInUI);
    yAxisNameInput.addEventListener('change', updateAxisLabelsInUI);

    applyAxisBtn.addEventListener('click', () => {
        updateChart();
    });

    addItemBtn.addEventListener('click', async () => {
        const name  = itemNameInput.value.trim();
        const x     = parseInt(xValueInput.value);
        const y     = parseInt(yValueInput.value);
        const color = itemColorInput.value;

        if (!name) {
            alert("Please enter a valid item name.");
            return;
        }

        try {
            const response = await fetch('/add_item', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, x, y, color })
            });
            const data = await response.json();

            if (!data.success) {
                alert("Could not add item: " + (data.error || 'Unknown error'));
                return;
            }

            items = data.items;
            updateChart();
            updateItemsList();
            saveItemsToLocalStorage(items);

            // Reset fields
            itemNameInput.value       = '';
            xValueInput.value         = '50';
            yValueInput.value         = '50';
            xRangeValueSpan.textContent = '50';
            yRangeValueSpan.textContent = '50';

        } catch (error) {
            console.error("Error adding item:", error);
        }
    });

    window.deleteItem = async (id) => {
        try {
            const response = await fetch('/delete_item', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            const data = await response.json();
            items = data.items;
            updateChart();
            updateItemsList();
            saveItemsToLocalStorage(items);
        } catch (error) {
            console.error("Error deleting item:", error);
        }
    };

    clearAllBtn.addEventListener('click', async () => {
        if (!confirm("Are you sure you want to clear all items?")) return;
        try {
            const response = await fetch('/clear_all', {
                method: 'POST'
            });
            const data = await response.json();
            items = data.items; 
            updateChart();
            updateItemsList();
            saveItemsToLocalStorage(items);
        } catch (error) {
            console.error("Error clearing all items:", error);
        }
    });

    downloadBtn.addEventListener('click', async () => {
        const serializer = new XMLSerializer();
        let svgStr = serializer.serializeToString(chartSvg);

        const parser = new DOMParser();
        const doc = parser.parseFromString(svgStr, "image/svg+xml");
        const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
        rect.setAttribute("x", "-150");
        rect.setAttribute("y", "-150");
        rect.setAttribute("width", "300");
        rect.setAttribute("height", "300");
        rect.setAttribute("fill", "white");
        doc.documentElement.insertBefore(rect, doc.documentElement.firstChild);
        svgStr = new XMLSerializer().serializeToString(doc);

        const canvas = document.createElement('canvas');
        canvas.width = 1500;
        canvas.height = 1500;
        const ctx = canvas.getContext('2d');

        const v = await canvg.Canvg.fromString(ctx, svgStr);
        await v.render();

        const link = document.createElement('a');
        link.download = 'quadrant-chart.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
    });

    // --------------------------------------------------
    // Initial Load
    // --------------------------------------------------
    document.addEventListener('DOMContentLoaded', async () => {
        try {
            const resp = await fetch('/get_items');
            const serverItems = await resp.json();
            items = serverItems;
            saveItemsToLocalStorage(items);
        } catch (error) {
            console.warn("Could not fetch items from server:", error);
            // If fetch fails, fallback to local storage 
            const localItems = loadItemsFromLocalStorage();
            if (localItems) {
                items = localItems;
            }
        }
        updateChart();
        updateItemsList();
        updateAxisLabelsInUI();
    });

})();
