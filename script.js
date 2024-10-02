let undoStack = [];
// 全局变量
let tasks = [];
let isDragging = false;
let dragTask = null;
let offsetY = 0;
let selectedTask = null;
let viewStartHour = 6; // 视图开始时间
let viewEndHour = 18; // 视图结束时间
let isDraggingView = false;
let lastMouseX = 0;
const leftMargin = 40; // 左侧空白区域宽度

const canvas = document.getElementById('chart');
const ctx = canvas.getContext('2d');
const colors = {
    'flight-arrival': '#9458CC',
    'flight-departure': '#469CD6'
};
const rowHeight = 60; // 调整行高
const taskHeight = 50; // 增加任务条高度
const startY = 50;

// 为导出甘特图按钮添加点击事件
document.getElementById('exportChartBtn').addEventListener('click', function () {
    // 将 canvas 转换为图片
    const image = canvas.toDataURL("image/png");

    // 创建一个 a 标签用于下载
    const link = document.createElement('a');
    link.href = image;
    link.download = 'gantt-chart.png';  // 设置下载文件名
    link.click();  // 自动触发下载
});


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
                    let [taskName, startTime, taskType] = row;

                    // 检查 startTime 是否为时间对象，并转换为字符串
                    if (typeof startTime === 'object') {
                        startTime = startTime.toTimeString().slice(0, 5); // 转换为 HH:MM
                    }

                    // 如果是数字格式的 Excel 时间，进行转换
                    if (typeof startTime === 'number') {
                        let date = new Date((startTime - 25569) * 86400 * 1000);  // Excel 日期转换公式
                        let hours = date.getUTCHours();
                        let minutes = date.getUTCMinutes();
                        startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
                    }

                    // 调用 createTask，设置 isImported 为 true 确保任务时长为固定的 50 分钟
                    const task = createTask(taskName, startTime, taskType, 50, true);
                    
                    // 查找合适的行（如果有重叠，将任务移动到下一行）
                    task.row = findAvailableRow(task.startDate, task.endDate);
                    task.y = startY + task.row * rowHeight + (rowHeight - taskHeight) / 2;

                    return task;
                });

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
document.getElementById('view6h').addEventListener('click', () => setViewRange(6));
document.getElementById('view12h').addEventListener('click', () => setViewRange(12));
document.getElementById('view18h').addEventListener('click', () => setViewRange(18));
document.getElementById('view24h').addEventListener('click', () => setViewRange(24));

function addTask() {
    const taskName = document.getElementById('taskName').value;
    const startTime = document.getElementById('startTime').value;
    const taskType = document.getElementById('taskType').value;
    const taskCount = parseInt(document.getElementById('taskCount').value, 10) || 1;
    const taskDuration = parseInt(document.getElementById('taskDuration').value, 10) || 50; // 获取自定义时长

    if (taskName && startTime && taskCount > 0 && taskDuration > 0) {
        undoStack.push(tasks.map(task => ({ ...task }))); // 在添加新任务之前保存当前状态
        for (let i = 0; i < taskCount; i++) {
            const task = createTask(taskName, startTime, taskType, taskDuration);  // 自定义时长
            if (task) {
                tasks.push(task);
            }
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
        tasks = undoStack.pop().map(task => ({ ...task })); // 深拷贝任务列表
        updateChart();
    }
}

function createTask(taskName, startTime, taskType, taskDuration = 50, isImported = false) {
    taskName = taskName.toUpperCase();  // 将任务名称转换为大写

    let [hours, minutes] = startTime.split(':').map(Number);

    if (isNaN(hours) || isNaN(minutes)) {
        console.error("Invalid startTime format:", startTime);  // 捕获无效时间格式
        return null;
    }

    let startDate = new Date(2024, 0, 1, hours, minutes);  // 初始化任务的开始时间
    let endDate;

    // 如果是导入的任务，任务时长强制设置为50分钟
    if (isImported) {
        taskDuration = 50;
    }

    if (taskType === 'flight-arrival') {
        // 进港任务：开始时间提前 15 分钟，时长为用户自定义时长（或默认 50 分钟）
        startDate.setMinutes(startDate.getMinutes() - 15);  // 开始时间提前 15 分钟
        endDate = new Date(startDate.getTime() + taskDuration * 60000);  // 结束时间为开始时间加上时长
    } else if (taskType === 'flight-departure') {
        if (isImported) {
            // 导入任务时，出港任务固定提前 50 分钟
            startDate.setMinutes(startDate.getMinutes() - 50);
            endDate = new Date(startDate.getTime() + taskDuration * 60000);  // 结束时间为开始时间加上时长
        } else {
            // 手动添加任务时，出港任务的开始时间为用户输入时间减去自定义时长
            startDate.setMinutes(startDate.getMinutes() - taskDuration);
            endDate = new Date(2024, 0, 1, hours, minutes);  // 结束时间为用户输入的时间
        }
    }

    // 分配任务到合适的行
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
    document.getElementById('taskDuration').value = '50'; // 重置为默认时长
}


function updateChart() {
    const maxRowIndex = tasks.length > 0 ? Math.max(...tasks.map(task => task.row)) : 0;
    canvas.height = startY + (maxRowIndex + 1) * rowHeight + 50;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save(); // 保存上下文状态
    ctx.translate(leftMargin, 0);

    drawTimeAxis();
    drawRows(maxRowIndex);
    assignTaskSlots();
    drawTasks();

    ctx.restore(); // 恢复上下文状态

    const taskCountPerRow = calculateTaskCountPerRow();
    drawTaskCount(taskCountPerRow);

    document.getElementById('undoBtn').disabled = undoStack.length === 0;
}

function setViewRange(hours) {
    viewStartHour = 0;
    viewEndHour = hours;
    updateChart();
}

function drawTimeAxis() {
    const hourWidth = (canvas.width - leftMargin) / (viewEndHour - viewStartHour);

    ctx.fillStyle = 'black';
    ctx.font = '12px Arial';

    // 调整开始和结束小时，确保是整数
    const startHour = Math.floor(viewStartHour);
    const endHour = Math.ceil(viewEndHour);

    for (let hour = startHour; hour <= endHour; hour++) {
        for (let quarter = 0; quarter < 4; quarter++) {
            const time = hour + quarter * 0.25; // 以小时为单位的时间（每15分钟一个刻度）
            if (time < viewStartHour || time > viewEndHour) continue;

            const x = (time - viewStartHour) * hourWidth;
            if (quarter === 0) {
                // 格式化时间标签
                const timeString = `${(Math.floor(time) % 24).toString().padStart(2, '0')}:00`;
                ctx.fillText(timeString, x, 20);
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
        ctx.moveTo(0, y); // 从左侧开始画线
        ctx.lineTo(canvas.width - leftMargin, y); // 减去左侧空白区域宽度
        ctx.strokeStyle = '#e0e0e0';
        ctx.stroke();
    }
}

function assignTaskSlots() {
    tasks.forEach(task => {
        if (task.isDragging) {
            // 拖动时不更新行
            task.displayY = task.y;
            task.displayHeight = taskHeight;
            task.isOverlapping = false;
        } else {
            // 计算任务所在的行
            task.row = Math.max(0, Math.round((task.y - startY) / rowHeight));
            task.displayHeight = taskHeight;
            task.displayY = startY + task.row * rowHeight + (rowHeight - taskHeight) / 2;
            task.isOverlapping = false;
        }
    });

    // 检测每一行的重叠任务
    const tasksByRow = {};
    tasks.forEach(task => {
        if (!task.isDragging) {
            if (!tasksByRow[task.row]) {
                tasksByRow[task.row] = [];
            }
            tasksByRow[task.row].push(task);
        }
    });

    for (let row in tasksByRow) {
        const rowTasks = tasksByRow[row];
        rowTasks.sort((a, b) => a.startDate - b.startDate);

        rowTasks.forEach(task => {
            const overlappingTasks = rowTasks.filter(t => isTimeOverlap(task, t));
            if (overlappingTasks.length > 1) {
                // 存在重叠，调整高度和位置
                const maxSlots = overlappingTasks.length;
                task.slot = overlappingTasks.findIndex(t => t === task);
                task.displayHeight = (rowHeight - 10) / maxSlots;
                task.displayY = startY + task.row * rowHeight + 5 + task.slot * task.displayHeight;
                task.isOverlapping = true;
            } else {
                // 没有重叠，居中显示
                task.displayHeight = taskHeight;
                task.displayY = startY + task.row * rowHeight + (rowHeight - taskHeight) / 2;
                task.isOverlapping = false;
            }
        });
    }
}

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

function drawTaskCount(taskCountPerRow) {
    ctx.fillStyle = 'black';
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (const [row, count] of Object.entries(taskCountPerRow)) {
        const y = startY + parseInt(row) * rowHeight + rowHeight / 2;
        ctx.fillText(`${count}`, -10, y);
    }
}

function drawTasks() {
    // 按开始时间排序任务，防止遮挡
    tasks.sort((a, b) => a.startDate - b.startDate);

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
        ctx.fillStyle = gradient;

        roundRect(ctx, startX, task.displayY, width, task.displayHeight, 6, true, false);

        // 清除阴影
        ctx.shadowColor = "transparent";

        // 绘制文字
        ctx.fillStyle = 'white';
        ctx.font = '11px Arial';  // 使用加粗字体提升清晰度
        const startTimeText = formatTime(task.startDate);
        const endTimeText = formatTime(task.endDate);
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
    const hourWidth = (canvas.width - leftMargin) / (viewEndHour - viewStartHour);
    const taskStart = (task.startDate.getHours() + task.startDate.getMinutes() / 60);
    const taskEnd = (task.endDate.getHours() + task.endDate.getMinutes() / 60);

    const startX = (taskStart - viewStartHour) * hourWidth;
    const endX = (taskEnd - viewStartHour) * hourWidth;
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

// 鼠标事件处理
canvas.addEventListener('mousedown', (e) => {
    const { x, y } = getEventPos(e);
    const clickedTask = isTaskClicked(x, y);
    if (clickedTask) {
        isDragging = true;
        dragTask = clickedTask;
        dragTask.isDragging = true; // 标记任务正在拖动
        offsetY = y - dragTask.y;
    } else {
        isDraggingView = true;
        lastMouseX = x;
    }
});

canvas.addEventListener('mousemove', (e) => {
    const { x, y } = getEventPos(e);
    if (isDragging && dragTask) {
        // 拖动任务条
        dragTask.y = y - offsetY;
        updateChart();
    } else if (isDraggingView) {
        // 拖动视图
        const dx = x - lastMouseX;
        const hourWidth = (canvas.width - leftMargin) / (viewEndHour - viewStartHour);
        const hourShift = dx / hourWidth;
        viewStartHour = viewStartHour - hourShift;
        viewEndHour = viewEndHour - hourShift;

        // 限制视图范围并取整到两位小数
        viewStartHour = Math.max(0, Math.round(viewStartHour * 100) / 100);
        viewEndHour = Math.min(24, Math.round(viewEndHour * 100) / 100);

        // 确保视图范围合法
        if (viewStartHour < 0) {
            viewStartHour = 0;
            viewEndHour = viewStartHour + (viewEndHour - viewStartHour);
        }
        if (viewEndHour > 24) {
            viewEndHour = 24;
            viewStartHour = viewEndHour - (viewEndHour - viewStartHour);
        }
        lastMouseX = x;
        updateChart();
    } else {
        // 在 mousemove 事件中
        const hoveredTask = isTaskClicked(x, y);
        if (hoveredTask) {
            showTooltip(hoveredTask, x, y); // 使用相对坐标
        } else {
            hideTooltip();
        }
    }
});

canvas.addEventListener('mouseup', () => {
    if (isDragging && dragTask) {
        undoStack.push(tasks.map(task => ({ ...task }))); // 保存拖动前的状态
        snapToNearestRow(dragTask);
        dragTask.isDragging = false; // 结束拖动状态
        updateChart();
        isDragging = false;
        dragTask = null;
    }
    isDraggingView = false;
});

canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();  // 禁止默认的右键菜单
    const { x, y } = getEventPos(e);
    const clickedTask = isTaskClicked(x, y);
    if (clickedTask) {
        undoStack.push(tasks.map(task => ({ ...task }))); // 保存删除前的状态
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
        undoStack.push(tasks.map(task => ({ ...task }))); // 保存复制前的状态
        // 复制任务
        const newTask = { ...clickedTask };

        // 保持时间不变，不修改开始和结束时间
        newTask.startDate = new Date(clickedTask.startDate);
        newTask.endDate = new Date(clickedTask.endDate);

        // 查找可用行
        const newRowIndex = findAvailableRow(newTask.startDate, newTask.endDate);
        newTask.row = newRowIndex;
        newTask.y = startY + newRowIndex * rowHeight + (rowHeight - taskHeight) / 2;

        tasks.push(newTask);  // 将复制的任务添加到任务列表
        updateChart();  // 刷新画布
    }
});



function formatTime(date) {
    return date.toTimeString().substr(0, 5);
}

// 修改后的 getEventPos 函数
function getEventPos(e) {
    const rect = canvas.getBoundingClientRect();
    return { 
        x: e.clientX - rect.left, // 不再减去 leftMargin
        y: e.clientY - rect.top
    };
}

// 修改后的 isTaskClicked 函数
function isTaskClicked(x, y) {
    return tasks.find(task => {
        const { x: startX, width } = getTaskXAndWidth(task);
        const taskY = task.displayY || task.y;
        const taskH = task.displayHeight || taskHeight;
        const adjustedStartX = startX + leftMargin; // 调整任务条的X坐标
        return x >= adjustedStartX && x <= adjustedStartX + width && y >= taskY && y <= taskY + taskH;
    });
}

function snapToNearestRow(task) {
    const rowIndex = Math.round((task.y - startY) / rowHeight);
    task.row = Math.max(0, rowIndex);
    task.y = startY + task.row * rowHeight + (rowHeight - taskHeight) / 2;
}

function exportData() {
    const fileName = prompt('请输入导出文件名:', 'tasks');
    if (fileName) {
        const data = JSON.stringify(tasks);
        const blob = new Blob([data], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.json`;
        a.click();
        window.URL.revokeObjectURL(url);
    }
}

document.getElementById('undoBtn').addEventListener('click', undo);

canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchMove);
canvas.addEventListener('touchend', handleTouchEnd);

function handleTouchStart(e) {
    // 将触摸事件转换为鼠标事件处理
}

function handleTouchMove(e) {
    // 将触摸事件转换为鼠标事件处理
}

function handleTouchEnd(e) {
    // 将触摸事件转换为鼠标事件处理
}

