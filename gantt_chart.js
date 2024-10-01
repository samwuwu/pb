class GanttChart {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // 初始化参数
        this.tasks = [];
        this.undoStack = [];
        this.isDragging = false;
        this.dragTask = null;
        this.offsetY = 0;
        this.isDraggingView = false;
        this.lastTouchX = 0;
        this.lastTouchY = 0;
        this.viewStartHour = 6;
        this.viewEndHour = 18;
        this.leftMargin = 40;
        this.rowHeight = 60;
        this.taskHeight = 50;
        this.startY = 50;
        this.colors = {
            'flight-arrival': '#9458CC',
            'flight-departure': '#469CD6'
        };

        // 事件绑定
        this.bindEvents();

        // 调整画布尺寸
        this.resizeCanvas();
        window.addEventListener('resize', this.resizeCanvas.bind(this));

        // 初始化工具提示和上下文菜单
        this.initTooltip();
        this.initContextMenu();

        // 检查屏幕方向
        this.checkOrientation();
        window.addEventListener('orientationchange', this.checkOrientation.bind(this));
    }

    bindEvents() {
        // 按钮事件
        document.getElementById('addTaskBtn').addEventListener('click', this.addTask.bind(this));
        document.getElementById('exportBtn').addEventListener('click', this.exportData.bind(this));
        document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importInput').click());
        document.getElementById('importInput').addEventListener('change', this.importData.bind(this));
        document.getElementById('view6h').addEventListener('click', () => this.setViewRange(6));
        document.getElementById('view12h').addEventListener('click', () => this.setViewRange(12));
        document.getElementById('view18h').addEventListener('click', () => this.setViewRange(18));
        document.getElementById('view24h').addEventListener('click', () => this.setViewRange(24));
        document.getElementById('undoBtn').addEventListener('click', this.undo.bind(this));

        // 画布事件
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.throttle(this.handleMouseMove.bind(this), 16));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('dblclick', this.handleDoubleClick.bind(this));
        this.canvas.addEventListener('contextmenu', this.handleContextMenu.bind(this));

        // 触摸事件
        this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
        this.canvas.addEventListener('touchcancel', this.handleTouchEnd.bind(this));
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth - 40;
        this.updateChart();
    }

    // 检查屏幕方向
    checkOrientation() {
        if (window.matchMedia("(orientation: portrait)").matches) {
            document.body.classList.add('portrait');
        } else {
            document.body.classList.remove('portrait');
        }
    }

    // 初始化上下文菜单
    initContextMenu() {
        this.contextMenu = document.getElementById('contextMenu');
        this.copyTaskMenuItem = document.getElementById('copyTask');
        this.deleteTaskMenuItem = document.getElementById('deleteTask');

        this.copyTaskMenuItem.addEventListener('click', () => {
            if (this.selectedTask) {
                this.copyTask(this.selectedTask);
                this.hideContextMenu();
            }
        });

        this.deleteTaskMenuItem.addEventListener('click', () => {
            if (this.selectedTask) {
                this.deleteTask(this.selectedTask);
                this.hideContextMenu();
            }
        });

        document.addEventListener('click', (e) => {
            if (this.contextMenu.style.display === 'block' && !this.contextMenu.contains(e.target)) {
                this.hideContextMenu();
            }
        });
    }

    // 显示上下文菜单
    showContextMenu(x, y, task) {
        this.selectedTask = task;
        this.contextMenu.style.left = `${x}px`;
        this.contextMenu.style.top = `${y}px`;
        this.contextMenu.style.display = 'block';
    }

    // 隐藏上下文菜单
    hideContextMenu() {
        this.contextMenu.style.display = 'none';
        this.selectedTask = null;
    }

    // 复制任务
    copyTask(task) {
        this.undoStack.push(this.deepCopy(this.tasks)); // 保存复制前的状态
        const newTask = this.deepCopy(task);

        newTask.startDate = new Date(task.startDate);
        newTask.endDate = new Date(task.endDate);

        const newRowIndex = this.findAvailableRow(newTask.startDate, newTask.endDate);
        newTask.row = newRowIndex;
        newTask.y = this.startY + newRowIndex * this.rowHeight + (this.rowHeight - this.taskHeight) / 2;

        this.tasks.push(newTask);
        this.updateChart();
    }

    // 删除任务
    deleteTask(task) {
        this.undoStack.push(this.deepCopy(this.tasks)); // 保存删除前的状态
        this.tasks = this.tasks.filter(t => t !== task);
        this.updateChart();
    }

    // 添加任务
    addTask() {
        const taskName = document.getElementById('taskName').value.trim().toUpperCase();
        const startTime = document.getElementById('startTime').value.trim();
        const taskType = document.getElementById('taskType').value;
        const taskCount = parseInt(document.getElementById('taskCount').value, 10) || 1;
        const taskDuration = parseInt(document.getElementById('taskDuration').value, 10);

        if (!taskName || !startTime || taskCount <= 0 || isNaN(taskDuration) || taskDuration <= 0) {
            alert('请输入有效的航班号、时间、任务数量和任务时长');
            return;
        }

        this.undoStack.push(this.deepCopy(this.tasks)); // 保存当前状态

        for (let i = 0; i < taskCount; i++) {
            const task = this.createTask(taskName, startTime, taskType, taskDuration);
            if (task) {
                this.tasks.push(task);
            }
        }

        this.updateChart();
        this.clearInputs();
    }

    // 创建任务对象
    createTask(taskName, startTime, taskType, taskDuration) {
        if (typeof startTime === 'number') {
            const date = new Date((startTime - 25569) * 86400 * 1000);  // Excel时间格式转换
            const hours = date.getUTCHours();
            const minutes = date.getUTCMinutes();
            startTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        }

        let [hours, minutes] = startTime.split(':').map(Number);

        if (isNaN(hours) || isNaN(minutes)) {
            console.error("Invalid startTime format:", startTime);
            return null;
        }

        let startDate, endDate;
        startDate = new Date(2024, 0, 1, hours, minutes);

        // 根据任务类型调整开始时间和结束时间
        if (taskType === 'flight-arrival') {
            startDate.setMinutes(startDate.getMinutes() - 15);
        } else {
            startDate.setMinutes(startDate.getMinutes() - taskDuration);
        }
        endDate = new Date(startDate.getTime() + taskDuration * 60000);

        const rowIndex = this.findAvailableRow(startDate, endDate);
        const y = this.startY + rowIndex * this.rowHeight + (this.rowHeight - this.taskHeight) / 2;

        return { taskName, startDate, endDate, taskType, row: rowIndex, y };
    }

    // 找到可用的行
    findAvailableRow(startDate, endDate) {
        for (let row = 0; row <= this.tasks.length; row++) {
            const rowTasks = this.tasks.filter(task => task.row === row);
            if (rowTasks.every(task => !this.isTimeOverlap({ startDate, endDate }, task))) {
                return row;
            }
        }
        return this.tasks.length;
    }

    // 判断时间是否重叠
    isTimeOverlap(task1, task2) {
        return task1.startDate < task2.endDate && task2.startDate < task1.endDate;
    }

    // 清除输入框
    clearInputs() {
        document.getElementById('taskName').value = '';
        document.getElementById('startTime').value = '';
        document.getElementById('taskCount').value = '1';
        document.getElementById('taskDuration').value = '50';
    }

    // 更新甘特图
    updateChart() {
        if (this.animationFrameId) return; // 防止多次调用

        this.animationFrameId = requestAnimationFrame(() => {
            const maxRowIndex = this.tasks.length > 0 ? Math.max(...this.tasks.map(task => task.row)) : 0;
            this.canvas.height = this.startY + (maxRowIndex + 1) * this.rowHeight + 50;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.save();
            this.ctx.translate(this.leftMargin, 0);

            this.drawTimeAxis();
            this.drawRows(maxRowIndex);
            this.assignTaskSlots();
            this.drawTasks();

            this.ctx.restore();

            const taskCountPerRow = this.calculateTaskCountPerRow();
            this.drawTaskCount(taskCountPerRow);

            document.getElementById('undoBtn').disabled = this.undoStack.length === 0;

            this.animationFrameId = null; // 重置动画帧ID
        });
    }

    // 设置视图范围
    setViewRange(hours) {
        this.viewStartHour = 0;
        this.viewEndHour = hours;
        this.updateChart();
    }

    // 绘制时间轴
    drawTimeAxis() {
        const hourWidth = (this.canvas.width - this.leftMargin) / (this.viewEndHour - this.viewStartHour);

        this.ctx.fillStyle = 'black';
        this.ctx.font = '12px Arial';

        const startHour = Math.floor(this.viewStartHour);
        const endHour = Math.ceil(this.viewEndHour);

        for (let hour = startHour; hour <= endHour; hour++) {
            for (let quarter = 0; quarter < 4; quarter++) {
                const time = hour + quarter * 0.25;
                if (time < this.viewStartHour || time > this.viewEndHour) continue;

                const x = (time - this.viewStartHour) * hourWidth;
                if (quarter === 0) {
                    const timeString = `${(Math.floor(time) % 24).toString().padStart(2, '0')}:00`;
                    this.ctx.fillText(timeString, x, 20);
                }
                this.ctx.beginPath();
                if (quarter === 0 || quarter === 2) {
                    this.ctx.moveTo(x, 25);
                    this.ctx.lineTo(x, 40);
                    this.ctx.strokeStyle = 'black';
                } else {
                    this.ctx.moveTo(x, 30);
                    this.ctx.lineTo(x, 40);
                    this.ctx.strokeStyle = '#ccc';
                }
                this.ctx.stroke();
            }
        }
    }

    // 绘制行
    drawRows(maxRowIndex) {
        for (let i = 0; i <= maxRowIndex; i++) {
            const y = this.startY + i * this.rowHeight;
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width - this.leftMargin, y);
            this.ctx.strokeStyle = '#e0e0e0';
            this.ctx.stroke();
        }
    }

    // 分配任务槽位
    assignTaskSlots() {
        this.tasks.forEach(task => {
            if (task.isDragging) {
                task.displayY = task.y;
                task.displayHeight = this.taskHeight;
                task.isOverlapping = false;
            } else {
                task.row = Math.max(0, Math.round((task.y - this.startY) / this.rowHeight));
                task.displayHeight = this.taskHeight;
                task.displayY = this.startY + task.row * this.rowHeight + (this.rowHeight - this.taskHeight) / 2;
                task.isOverlapping = false;
            }
        });

        const tasksByRow = {};
        this.tasks.forEach(task => {
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
                const overlappingTasks = rowTasks.filter(t => this.isTimeOverlap(task, t));
                if (overlappingTasks.length > 1) {
                    const maxSlots = overlappingTasks.length;
                    task.slot = overlappingTasks.findIndex(t => t === task);
                    task.displayHeight = (this.rowHeight - 10) / maxSlots;
                    task.displayY = this.startY + task.row * this.rowHeight + 5 + task.slot * task.displayHeight;
                    task.isOverlapping = true;
                } else {
                    task.displayHeight = this.taskHeight;
                    task.displayY = this.startY + task.row * this.rowHeight + (this.rowHeight - this.taskHeight) / 2;
                    task.isOverlapping = false;
                }
            });
        }
    }

    // 计算每行任务数量
    calculateTaskCountPerRow() {
        const taskCountPerRow = {};
        this.tasks.forEach(task => {
            if (taskCountPerRow[task.row]) {
                taskCountPerRow[task.row]++;
            } else {
                taskCountPerRow[task.row] = 1;
            }
        });
        return taskCountPerRow;
    }

    // 绘制每行的任务数量
    drawTaskCount(taskCountPerRow) {
        this.ctx.fillStyle = 'black';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.textBaseline = 'middle';

        for (const [row, count] of Object.entries(taskCountPerRow)) {
            const y = this.startY + parseInt(row) * this.rowHeight + this.rowHeight / 2;
            this.ctx.fillText(`${count}`, -10, y);
        }
    }

    // 绘制任务
    drawTasks() {
        this.tasks.sort((a, b) => a.startDate - b.startDate);

        this.tasks.forEach(task => {
            const { x: startX, width } = this.getTaskXAndWidth(task);

            // 优化阴影效果
            this.ctx.shadowColor = "rgba(0, 0, 0, 0.15)";
            this.ctx.shadowBlur = 10;
            this.ctx.shadowOffsetX = 2;
            this.ctx.shadowOffsetY = 2;

            // 绘制任务条
            let gradient = this.ctx.createLinearGradient(startX, task.displayY, startX + width, task.displayY + task.displayHeight);
            gradient.addColorStop(0, this.colors[task.taskType] || 'lightgray');
            this.ctx.fillStyle = gradient;

            this.roundRect(this.ctx, startX, task.displayY, width, task.displayHeight, 6, true, false);

            // 清除阴影
            this.ctx.shadowColor = "transparent";

            // 绘制文字
            this.ctx.fillStyle = 'white';
            this.ctx.font = '11px Arial';
            const startTimeText = this.formatTime(task.startDate);
            const endTimeText = this.formatTime(task.endDate);
            const endTimeWidth = this.ctx.measureText(endTimeText).width;

            if (task.isOverlapping) {
                this.ctx.fillText(startTimeText, startX + 5, task.displayY + 12);
                this.ctx.fillText(endTimeText, startX + width - endTimeWidth - 5, task.displayY + 12);
            } else {
                this.ctx.fillText(startTimeText, startX + 5, task.displayY + 12);
                this.ctx.fillText(endTimeText, startX + width - endTimeWidth - 5, task.displayY + 12);
                const flightNumberX = startX + width / 2 - this.ctx.measureText(task.taskName).width / 2;
                this.ctx.fillText(task.taskName, flightNumberX, task.displayY + task.displayHeight - 5);
            }
        });
    }

    // 获取任务的X坐标和宽度
    getTaskXAndWidth(task) {
        const hourWidth = (this.canvas.width - this.leftMargin) / (this.viewEndHour - this.viewStartHour);
        const taskStart = (task.startDate.getHours() + task.startDate.getMinutes() / 60);
        const taskEnd = (task.endDate.getHours() + task.endDate.getMinutes() / 60);

        const startX = (taskStart - this.viewStartHour) * hourWidth;
        const endX = (taskEnd - this.viewStartHour) * hourWidth;
        return { x: startX, width: endX - startX };
    }

    // 绘制圆角矩形
    roundRect(ctx, x, y, width, height, radius, fill, stroke) {
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

    // 格式化时间
    formatTime(date) {
        return date.toTimeString().substr(0, 5);
    }

    // 撤销操作
    undo() {
        if (this.undoStack.length > 0) {
            this.tasks = this.deepCopy(this.undoStack.pop());
            this.updateChart();
        }
    }

    // 深拷贝
    deepCopy(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    // 鼠标事件处理
    handleMouseDown(e) {
        const { x, y } = this.getEventPos(e);
        const clickedTask = this.isTaskClicked(x, y);
        if (clickedTask) {
            this.isDragging = true;
            this.dragTask = clickedTask;
            this.dragTask.isDragging = true;
            this.offsetY = y - this.dragTask.y;
        } else {
            this.isDraggingView = true;
            this.lastMouseX = x;
        }
    }

    handleMouseMove(e) {
        const { x, y } = this.getEventPos(e);
        if (this.isDragging && this.dragTask) {
            this.dragTask.y = y - this.offsetY;
            this.updateChart();
        } else if (this.isDraggingView) {
            const dx = x - this.lastMouseX;
            const hourWidth = (this.canvas.width - this.leftMargin) / (this.viewEndHour - this.viewStartHour);
            const hourShift = dx / hourWidth;
            this.viewStartHour = this.viewStartHour - hourShift;
            this.viewEndHour = this.viewEndHour - hourShift;

            this.viewStartHour = Math.max(0, Math.round(this.viewStartHour * 100) / 100);
            this.viewEndHour = Math.min(24, Math.round(this.viewEndHour * 100) / 100);

            if (this.viewStartHour < 0) {
                this.viewStartHour = 0;
                this.viewEndHour = this.viewStartHour + (this.viewEndHour - this.viewStartHour);
            }
            if (this.viewEndHour > 24) {
                this.viewEndHour = 24;
                this.viewStartHour = this.viewEndHour - (this.viewEndHour - this.viewStartHour);
            }
            this.lastMouseX = x;
            this.updateChart();
        } else {
            const hoveredTask = this.isTaskClicked(x, y);
            if (hoveredTask) {
                this.showTooltip(hoveredTask, e.clientX, e.clientY);
            } else {
                this.hideTooltip();
            }
        }
    }

    handleMouseUp() {
        if (this.isDragging && this.dragTask) {
            this.undoStack.push(this.deepCopy(this.tasks)); // 保存拖动前的状态
            this.snapToNearestRow(this.dragTask);
            this.dragTask.isDragging = false;
            this.updateChart();
            this.isDragging = false;
            this.dragTask = null;
        }
        this.isDraggingView = false;
    }

    handleDoubleClick(e) {
        const { x, y } = this.getEventPos(e);
        const clickedTask = this.isTaskClicked(x, y);
        if (clickedTask) {
            this.copyTask(clickedTask);
        }
    }

    handleContextMenu(e) {
        e.preventDefault();
        const { x, y } = this.getEventPos(e);
        const clickedTask = this.isTaskClicked(x, y);
        if (clickedTask) {
            this.showContextMenu(e.clientX, e.clientY, clickedTask);
        } else {
            this.hideContextMenu();
        }
    }

    // 触摸事件处理
    handleTouchStart(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const { x, y } = this.getEventPos(touch);
            this.touchStartTime = Date.now();
            this.touchTimer = setTimeout(() => {
                const clickedTask = this.isTaskClicked(x, y);
                if (clickedTask) {
                    this.showContextMenu(touch.clientX, touch.clientY, clickedTask);
                }
            }, 500);

            const clickedTask = this.isTaskClicked(x, y);
            if (clickedTask) {
                this.isDragging = true;
                this.dragTask = clickedTask;
                this.dragTask.isDragging = true;
                this.offsetY = y - this.dragTask.y;
            } else {
                this.isDraggingView = true;
                this.lastTouchX = x;
            }
        }
    }

    handleTouchMove(e) {
        e.preventDefault();
        clearTimeout(this.touchTimer);
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            const { x, y } = this.getEventPos(touch);

            if (this.isDragging && this.dragTask) {
                this.dragTask.y = y - this.offsetY;
                this.updateChart();
            } else if (this.isDraggingView) {
                const dx = x - this.lastTouchX;
                const hourWidth = (this.canvas.width - this.leftMargin) / (this.viewEndHour - this.viewStartHour);
                const hourShift = dx / hourWidth;
                this.viewStartHour = this.viewStartHour - hourShift;
                this.viewEndHour = this.viewEndHour - hourShift;

                this.viewStartHour = Math.max(0, Math.round(this.viewStartHour * 100) / 100);
                this.viewEndHour = Math.min(24, Math.round(this.viewEndHour * 100) / 100);

                if (this.viewStartHour < 0) {
                    this.viewStartHour = 0;
                    this.viewEndHour = this.viewStartHour + (this.viewEndHour - this.viewStartHour);
                }
                if (this.viewEndHour > 24) {
                    this.viewEndHour = 24;
                    this.viewStartHour = this.viewEndHour - (this.viewEndHour - this.viewStartHour);
                }
                this.lastTouchX = x;
                this.updateChart();
            }
        }
    }

    handleTouchEnd(e) {
        e.preventDefault();
        clearTimeout(this.touchTimer);
        if (this.isDragging && this.dragTask) {
            this.undoStack.push(this.deepCopy(this.tasks)); // 保存拖动前的状态
            this.snapToNearestRow(this.dragTask);
            this.dragTask.isDragging = false;
            this.updateChart();
            this.isDragging = false;
            this.dragTask = null;
        }
        this.isDraggingView = false;
    }

    // 获取事件坐标
    getEventPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left - this.leftMargin,
            y: e.clientY - rect.top
        };
    }

    // 判断任务是否被点击
    isTaskClicked(x, y) {
        return this.tasks.find(task => {
            const { x: startX, width } = this.getTaskXAndWidth(task);
            const taskY = task.displayY || task.y;
            const taskH = task.displayHeight || this.taskHeight;
            return x >= startX && x <= startX + width && y >= taskY && y <= taskY + taskH;
        });
    }

    // 任务对齐到最近的行
    snapToNearestRow(task) {
        const rowIndex = Math.round((task.y - this.startY) / this.rowHeight);
        task.row = Math.max(0, rowIndex);
        task.y = this.startY + task.row * this.rowHeight + (this.rowHeight - this.taskHeight) / 2;
    }

    // 显示工具提示
    showTooltip(task, clientX, clientY) {
        this.tooltip.style.left = `${clientX + 10}px`;
        this.tooltip.style.top = `${clientY + 10}px`;
        this.tooltip.style.display = 'block';
        this.tooltip.style.zIndex = '1000';
        this.tooltip.innerHTML = `
            <strong>航班号: ${this.escapeHtml(task.taskName)}</strong><br>
            开始时间: ${this.formatTime(task.startDate)}<br>
            结束时间: ${this.formatTime(task.endDate)}
        `;
    }

    // 隐藏工具提示
    hideTooltip() {
        this.tooltip.style.display = 'none';
    }

    // 导出数据
    exportData() {
        const dataStr = JSON.stringify(this.tasks, null, 2);
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

    // 导入数据
    importData(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            const fileExtension = file.name.split('.').pop().toLowerCase();

            if (fileExtension === 'json') {
                reader.onload = (e) => {
                    try {
                        const importedTasks = JSON.parse(e.target.result);
                        this.tasks = importedTasks.map(task => {
                            task.startDate = new Date(task.startDate);
                            task.endDate = new Date(task.endDate);
                            task.y = this.startY + task.row * this.rowHeight + (this.rowHeight - this.taskHeight) / 2;
                            return task;
                        });
                        this.updateChart();
                        alert('JSON数据导入成功！');
                    } catch (error) {
                        alert('无效的JSON文件。');
                    }
                };
                reader.readAsText(file);
            } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
                reader.onload = (e) => {
                    try {
                        const data = new Uint8Array(e.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });

                        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                        const sheetData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

                        this.undoStack.push(this.deepCopy(this.tasks)); // 保存当前状态

                        this.tasks = sheetData.slice(1).map(row => {
                            const [taskName, startTime, taskType, taskCount, taskDuration] = row;
                            let taskList = [];
                            for (let i = 0; i < (taskCount || 1); i++) {
                                const task = this.createTask(taskName, startTime, taskType, taskDuration || 50);
                                if (task) {
                                    taskList.push(task);
                                }
                            }
                            return taskList;
                        }).flat();

                        this.updateChart();
                        alert('Excel数据导入成功！');
                    } catch (error) {
                        console.error(error);
                        alert('无法解析Excel文件。');
                    }
                };
                reader.readAsArrayBuffer(file);
            } else {
                alert('只支持导入 JSON 或 Excel 文件');
            }
        }
    }

    // 工具函数：节流
    throttle(func, limit) {
        let inThrottle;
        return (...args) => {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    // 工具函数：转义HTML
    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, m => map[m]);
    }

    // 初始化工具提示
    initTooltip() {
        this.tooltip = document.getElementById('tooltip');
    }
}

// 创建甘特图实例
const ganttChart = new GanttChart('chart');
