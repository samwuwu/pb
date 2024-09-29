let undoStack = [];
// 全局变量
let tasks = [];
let isDragging = false;
let dragTask = null;
let offsetY = 0;
let selectedTask = null;

const canvas = document.getElementById('chart');
const ctx = canvas.getContext('2d');
const colors = {
    'flight-arrival': '#9458CC',
    'flight-departure': '#469CD6'
};
const rowHeight = 50;
const taskHeight = 40;
const startY = 50;

function importData(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        const fileExtension = file.name.split('.').pop().toLowerCase();

        if (fileExtension === 'json') {
            // 处理 JSON 文件
            reader.onload = function (e) {
                try {
                    const importedTasks = JSON.parse(e.target.result);
                    tasks = importedTasks.map(task => {
                        task.startDate = new Date(task.startDate);
                        task.endDate = new Date(task.endDate);
                        task.y = startY + task.row * rowHeight + (rowHeight - taskHeight) / 2;
                        return task;
                    });
                    updateChart();
                    alert('JSON数据导入成功！');
                } catch (error) {
                    alert('无效的JSON文件。');
                }
            };
            reader.readAsText(file);
        } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
            // 处理 Excel 文件
            reader.onload = function (e) {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // 假设任务数据在第一个工作表中
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const sheetData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

                // 将 Excel 数据转换为任务对象
                tasks = sheetData.slice(1).map(row => {
                    const [taskName, startTime, taskType, taskCount] = row;
                    let taskList = [];
                    for (let i = 0; i < (taskCount || 1); i++) {
                        const task = createTask(taskName, startTime, taskType);
                        taskList.push(task);
                    }
                    return taskList;
                }).flat();  // 将二维数组拍平

                updateChart();
                alert('Excel数据导入成功！');
            };
            reader.readAsArrayBuffer(file);
        } else {
            alert('只支持导入 JSON 或 Excel 文件');
        }
    }
}

// 调整画布宽度
function resizeCanvas() {
    canvas.width = window.innerWidth - 40;
    updateChart();
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

document.getElementById('addTaskBtn').addEventListener('click', addTask);
document.getElementById('exportBtn').addEventListener('click', exportData);
document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importInput').click());
document.getElementById('importInput').addEventListener('change', importData);

function addTask() {
    const taskName = document.getElementById('taskName').value;
    const startTime = document.getElementById('startTime').value;
    const taskType = document.getElementById('taskType').value;
    const taskCount = parseInt(document.getElementById('taskCount').value, 10) || 1;

    if (taskName && startTime && taskCount > 0) {
        undoStack.push([...tasks]); // 在添加新任务之前保存当前状态
        for (let i = 0; i < taskCount; i++) {
            const task = createTask(taskName, startTime, taskType);
            tasks.push(task);
        }
        updateChart();
        clearInputs();
    } else {
        alert('请输入航班号、时间和任务数量');
    }
}

// 添加撤销功能
function undo() {
    if (undoStack.length > 0) {
        tasks = undoStack.pop(); // 恢复到前一个状态
        updateChart();
    }
}

function createTask(taskName, startTime, taskType) {
    taskName = taskName.toUpperCase();  // 将任务名称转换为大写

    // 确保 startTime 是字符串，并处理其格式
    if (typeof startTime === 'number') {
        const date = new Date((startTime - 25569) * 86400 * 1000);  // Excel时间格式转换
        const hours = date.getUTCHours();
        const minutes = date.getUTCMinutes();
        startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    startTime = String(startTime);
    let [hours, minutes] = startTime.split(':').map(Number);

    if (isNaN(hours) || isNaN(minutes)) {
        console.error("Invalid startTime format:", startTime);  // 捕获无效时间格式
        return null;
    }

    let startDate, endDate;
    if (taskType === 'flight-arrival') {
        startDate = new Date(2024, 0, 1, hours, minutes - 15);
        endDate = new Date(startDate.getTime() + 50 * 60000);
    } else {
        startDate = new Date(2024, 0, 1, hours, minutes - 50);
        endDate = new Date(startDate.getTime() + 50 * 60000);
    }

    const rowIndex = findAvailableRow(startDate, endDate);
    const y = startY + rowIndex * rowHeight + (rowHeight - taskHeight) / 2;

    return { taskName, startDate, endDate, taskType, row: rowIndex, y };
}

function findAvailableRow(startDate, endDate) {
    for (let row = 0; row < tasks.length; row++) {
        const rowTasks = tasks.filter(task => task.row === row);
        if (rowTasks.length === 0) {
            return row; // 没有任务的行
        }
        const overlappingTasks = rowTasks.filter(task => isTimeOverlap({ startDate, endDate }, task));
        if (overlappingTasks.length === 0) {
            return row; // 没有时间冲突的行
        }
    }
    return tasks.length; // 创建新行
}

function isTimeOverlap(task1, task2) {
    return task1.startDate < task2.endDate && task2.startDate < task1.endDate;
}

function clearInputs() {
    document.getElementById('taskName').value = '';
    document.getElementById('startTime').value = '';
    document.getElementById('taskCount').value = '1';
}

function updateChart() {
    const maxRowIndex = tasks.length > 0 ? Math.max(...tasks.map(task => task.row)) : 0;
    canvas.height = startY + (maxRowIndex + 1) * rowHeight + 50;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 添加左侧空间用于显示任务数量
    const leftMargin = 40;
    ctx.translate(leftMargin, 0);
    
    drawTimeAxis();
    drawRows(maxRowIndex);
    assignTaskSlots();
    drawTasks();
    
    // 计算并绘制任务数量
    const taskCountPerRow = calculateTaskCountPerRow();
    ctx.translate(-leftMargin, 0);
    drawTaskCount(taskCountPerRow);
    ctx.translate(leftMargin, 0);
    
    // 更新撤销按钮状态
    document.getElementById('undoBtn').disabled = undoStack.length === 0;
}

function drawTimeAxis() {
    const startHour = 6, endHour = 24;
    const hourWidth = (canvas.width - 40) / (endHour - startHour); // 减去左侧空间宽度
    const quarterWidth = hourWidth / 4;

    ctx.fillStyle = 'black';
    ctx.font = '12px Arial';

    for (let hour = startHour; hour <= endHour; hour++) {
        for (let quarter = 0; quarter < 4; quarter++) {
            const x = (hour - startHour) * hourWidth + quarter * quarterWidth;
            if (quarter === 0) {
                ctx.fillText(`${hour.toString().padStart(2, '0')}:00`, x, 20);
            }
            ctx.beginPath();
            if (quarter === 0) {
                ctx.moveTo(x, 25);
                ctx.lineTo(x, 40);
                ctx.strokeStyle = 'black';
            } else if (quarter === 2) {
                ctx.moveTo(x, 30);
                ctx.lineTo(x, 40);
                ctx.strokeStyle = 'black';
            } else {
                ctx.moveTo(x, 30);
                ctx.lineTo(x, 40);
                ctx.strokeStyle = '#ccc';
            }
            ctx.stroke();
        }
    }
}

function drawRows(maxRowIndex) {
    for (let i = 0; i <= maxRowIndex; i++) {
        const y = startY + i * rowHeight;
        ctx.beginPath();
        ctx.moveTo(-40, y); // 从左侧空间开始画线
        ctx.lineTo(canvas.width - 40, y); // 减去左侧空间宽度
        ctx.strokeStyle = '#e0e0e0';
        ctx.stroke();
    }
}

function assignTaskSlots() {
    tasks.forEach(task => {
        const overlappingTasks = tasks.filter(t => t.row === task.row && isTimeOverlap(task, t));
        overlappingTasks.sort((a, b) => a.startDate - b.startDate);
        task.slot = overlappingTasks.findIndex(t => t === task);
        const maxSlots = overlappingTasks.length;
        
        // 如果任务条重叠太多，可以增加透明度或者调整显示高度
        task.displayHeight = taskHeight / (maxSlots * 1.5);  // 适当减小高度
        task.displayY = task.y + task.slot * task.displayHeight;
        task.isOverlapping = maxSlots > 1;
    });
}

// 计算每行的任务数量
function calculateTaskCountPerRow() {
    const taskCountPerRow = {};
    tasks.forEach(task => {
        if (taskCountPerRow[task.row]) {
            taskCountPerRow[task.row]++;
        } else {
            taskCountPerRow[task.row] = 1;
        }
    });
    return taskCountPerRow;
}

// 绘制任务数量
function drawTaskCount(taskCountPerRow) {
    ctx.fillStyle = 'black';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (const [row, count] of Object.entries(taskCountPerRow)) {
        const y = startY + parseInt(row) * rowHeight + rowHeight / 2;
        ctx.fillText(`${count}`, 30, y);
    }
}

function drawTasks() {
    tasks.forEach(task => {
        const { x: startX, width } = getTaskXAndWidth(task);

        // 优化阴影效果
        ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        // 绘制带渐变效果的圆角矩形任务条
        let gradient = ctx.createLinearGradient(startX, task.displayY, startX + width, task.displayY + task.displayHeight);
        gradient.addColorStop(0, colors[task.taskType] || 'lightgray');
        // gradient.addColorStop(1, '#FFFFFF');  // 加入渐变
        ctx.fillStyle = gradient;

        roundRect(ctx, startX, task.displayY, width, task.displayHeight, 6, true, false);

        // 清除阴影
        ctx.shadowColor = "transparent";
       
        // 动态调整字体大小
        let fontSize = Math.min(12, width / 10);  // 根据宽度动态调整字体大小
        ctx.font = `bold ${fontSize}px Arial`;

        // 绘制文字
        ctx.fillStyle = 'white';
        ctx.font = '11px Arial';  // 使用加粗字体提升清晰度
        const startTimeText = task.startDate.toTimeString().substr(0, 5);
        const endTimeText = task.endDate.toTimeString().substr(0, 5);
        const endTimeWidth = ctx.measureText(endTimeText).width;

        
        if (task.isOverlapping) {
            ctx.fillText(startTimeText, startX + 5, task.displayY + 12);
            ctx.fillText(endTimeText, startX + width - endTimeWidth - 5, task.displayY + 12);
        } else {
            ctx.fillText(startTimeText, startX + 5, task.displayY + 12);
            ctx.fillText(endTimeText, startX + width - endTimeWidth - 5, task.displayY + 12);
            const flightNumberX = startX + width / 2 - ctx.measureText(task.taskName).width / 2;
            ctx.fillText(task.taskName.toUpperCase(), flightNumberX, task.displayY + task.displayHeight - 5);
        }
    });
}

function getTaskXAndWidth(task) {
    const startHour = 6, endHour = 24;
    const hourWidth = (canvas.width - 40) / (endHour - startHour); // 减去左侧空间宽度
    const startX = ((task.startDate.getHours() - startHour) + task.startDate.getMinutes() / 60) * hourWidth;
    const endX = ((task.endDate.getHours() - startHour) + task.endDate.getMinutes() / 60) * hourWidth;
    return { x: startX, width: endX - startX };
}
    
    function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
        if (typeof stroke === 'undefined') {
            stroke = true;
        }
        if (typeof radius === 'undefined') {
            radius = 5;
        }
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        if (fill) {
            ctx.fill();
        }
        if (stroke) {
            ctx.stroke();
        }
    }
    
    // 鼠标拖动功能
    canvas.addEventListener('mousedown', (e) => {
        const { x, y } = getEventPos(e);
        const clickedTask = isTaskClicked(x, y);
        if (clickedTask) {
            isDragging = true;
            dragTask = clickedTask;
            offsetY = y - dragTask.y;
        }
    });
    // 使用鼠标滚轮或触摸事件实现缩放
canvas.addEventListener('wheel', (e) => {
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    ctx.scale(zoomFactor, 1);
    updateChart();
});

// 右键单击删除任务条
canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();  // 禁止默认的右键菜单
    const { x, y } = getEventPos(e);
    const clickedTask = isTaskClicked(x, y);
    if (clickedTask) {
        undoStack.push([...tasks]); // 保存删除前的状态
        // 从任务列表中删除任务
        tasks = tasks.filter(task => task !== clickedTask);
        updateChart();  // 刷新画布
    }
});

// 双击复制任务条
canvas.addEventListener('dblclick', (e) => {
    const { x, y } = getEventPos(e);
    const clickedTask = isTaskClicked(x, y);
    if (clickedTask) {
        undoStack.push([...tasks]); // 保存复制前的状态
        // 复制任务
        const newTask = { ...clickedTask };
        
        // 保持时间不变，不修改开始和结束时间
        newTask.startDate = new Date(clickedTask.startDate);
        newTask.endDate = new Date(clickedTask.endDate);
        
        // 只移动到下一个空行或指定行
        const newRowIndex = findAvailableRow(newTask.startDate, newTask.endDate);  // 查找可用行
        newTask.row = newRowIndex;
        newTask.y = startY + newRowIndex * rowHeight + (rowHeight - taskHeight) / 2;

        tasks.push(newTask);  // 将复制的任务添加到任务列表
        updateChart();  // 刷新画布
    }
});


    
    canvas.addEventListener('mousemove', (e) => {
        if (isDragging && dragTask) {
            const { y } = getEventPos(e);
            dragTask.y = y - offsetY;
            updateChart();
        }
    });
    
    canvas.addEventListener('mouseup', () => {
        if (isDragging && dragTask) {
            undoStack.push([...tasks]); // 保存拖动前的状态
            snapToNearestRow(dragTask);
            dragTask.row = Math.round((dragTask.y - startY) / rowHeight);
            updateChart();
            isDragging = false;
            dragTask = null;
        }
    });
    
    function getEventPos(e) {
        const rect = canvas.getBoundingClientRect();
        return { 
            x: e.clientX - rect.left - 40, // 减去左侧空间宽度
            y: e.clientY - rect.top 
        };
    }
    function isTaskClicked(x, y) {
        return tasks.find(task => {
            const { x: startX, width } = getTaskXAndWidth(task);
            const taskY = task.displayY || task.y;
            const taskH = task.displayHeight || taskHeight;
    
            return x >= startX && x <= startX + width && y >= taskY && y <= taskY + taskH;
        });
    }
    
    function snapToNearestRow(task) {
        const rowIndex = Math.round((task.y - startY) / rowHeight);
        task.row = Math.max(0, rowIndex);
        task.y = startY + task.row * rowHeight + (rowHeight - taskHeight) / 2;
    }
    
    function exportData() {
        const dataStr = JSON.stringify(tasks, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'gantt_chart_data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
   
    
    // 鼠标悬停显示提示
    canvas.addEventListener('mousemove', (e) => {
        if (isDragging && dragTask) {
            const { y } = getEventPos(e);
            dragTask.y = y - offsetY;
            updateChart();
        }
    });
    
    function showTooltip(task, clientX, clientY) {
        const tooltip = document.getElementById('tooltip');
        tooltip.style.left = `${clientX + 10}px`; // 使用 clientX，不需要调整
        tooltip.style.top = `${clientY + 10}px`;
        tooltip.style.display = 'block';
        tooltip.innerHTML = `<strong>航班号: ${task.taskName}</strong>`;
    }
    
    function hideTooltip() {
        const tooltip = document.getElementById('tooltip');
        tooltip.style.display = 'none';
    }

    // 添加事件监听器（在文件底部添加）
document.getElementById('undoBtn').addEventListener('click', undo);
    