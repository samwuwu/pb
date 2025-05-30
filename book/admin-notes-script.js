(function() {
    'use strict';

    // --- Configuration & Constants (与主页保持一致) ---
    const NOVEL_READER_CONFIG = {
        STORAGE_KEYS: {
            USER_NAME: 'NOVEL_READER_USER_NAME_V1',
            LOCAL_USER_ID: 'NOVEL_READER_LOCAL_USER_ID_V1'
        },
        API_BASE_URL: 'https://my-notes-api.sep12th.workers.dev', 
        ADMIN_PASSWORD: 'wucheng' // !!! 安全警告：硬编码密码，仅供演示，请勿用于生产环境 !!!
                                  // 已将密码更改为 'wucheng'
    };

    // --- DOM Elements ---
    let usernameDisplayEl, noteIdInputEl, fetchNotesBtn, fetchNotesErrorEl, notesDisplayAreaEl,
        confirmationModalEl, modalTitleEl, modalMessageEl, cancelConfirmBtnEl, confirmActionBtnEl,
        modalAuthInputGroupEl, confirmUsernameInputEl, confirmAuthErrorEl, overlayEl, // modalAuthInputGroupEl 和 confirmUsernameInputEl 仍用于普通用户删除
        adminPasswordInputEl, adminLoginBtn, adminErrorEl, adminFunctionsEl, listAllNotesBtn, allNotesListEl, listNotesErrorEl,
        adminLoginContainerEl,
        modalAdminPasswordInputGroupEl, confirmAdminPasswordInputEl, confirmAdminPasswordErrorEl; // 管理员密码输入组

    function cacheDOMElements() {
        usernameDisplayEl = document.getElementById('usernameDisplay');
        noteIdInputEl = document.getElementById('noteIdInput'); 
        fetchNotesBtn = document.getElementById('fetchNotesBtn');
        fetchNotesErrorEl = document.getElementById('fetchNotesError');
        notesDisplayAreaEl = document.getElementById('notesDisplayArea');

        confirmationModalEl = document.getElementById('confirmationModal');
        modalTitleEl = document.getElementById('modalTitle');
        modalMessageEl = document.getElementById('modalMessage');
        cancelConfirmBtnEl = document.getElementById('cancelConfirmBtn');
        confirmActionBtnEl = document.getElementById('confirmActionBtn');
        modalAuthInputGroupEl = document.getElementById('modalAuthInputGroup'); // 普通用户删除时显示
        confirmUsernameInputEl = document.getElementById('confirmUsernameInput');
        confirmAuthErrorEl = document.getElementById('confirmAuthError');
        overlayEl = document.getElementById('overlay');

        adminPasswordInputEl = document.getElementById('adminPasswordInput');
        adminLoginBtn = document.getElementById('adminLoginBtn');
        adminErrorEl = document.getElementById('adminError');
        adminFunctionsEl = document.getElementById('adminFunctions');
        listAllNotesBtn = document.getElementById('listAllNotesBtn');
        allNotesListEl = document.getElementById('allNotesList');
        listNotesErrorEl = document.getElementById('listNotesError');
        adminLoginContainerEl = document.getElementById('adminLoginContainer'); 

        // 确保这些元素被正确缓存
        modalAdminPasswordInputGroupEl = document.getElementById('modalAdminPasswordInputGroup'); // 管理员密码输入组
        confirmAdminPasswordInputEl = document.getElementById('confirmAdminPasswordInput');
        confirmAdminPasswordErrorEl = document.getElementById('confirmAdminPasswordError'); // 关键：确保这里正确缓存
        
        // 调试日志：检查元素是否为 null
        console.log("DOM Elements Cached:", {
            usernameDisplayEl: !!usernameDisplayEl, 
            noteIdInputEl: !!noteIdInputEl, 
            fetchNotesBtn: !!fetchNotesBtn, 
            fetchNotesErrorEl: !!fetchNotesErrorEl, 
            notesDisplayAreaEl: !!notesDisplayAreaEl,
            confirmationModalEl: !!confirmationModalEl, 
            modalTitleEl: !!modalTitleEl, 
            modalMessageEl: !!modalMessageEl, 
            cancelConfirmBtnEl: !!cancelConfirmBtnEl, 
            confirmActionBtnEl: !!confirmActionBtnEl,
            modalAuthInputGroupEl: !!modalAuthInputGroupEl, 
            confirmUsernameInputEl: !!confirmUsernameInputEl, 
            confirmAuthErrorEl: !!confirmAuthErrorEl, 
            overlayEl: !!overlayEl,
            adminPasswordInputEl: !!adminPasswordInputEl, 
            adminLoginBtn: !!adminLoginBtn, 
            adminErrorEl: !!adminErrorEl, 
            adminFunctionsEl: !!adminFunctionsEl, 
            listAllNotesBtn: !!listAllNotesBtn, 
            allNotesListEl: !!allNotesListEl, 
            listNotesErrorEl: !!listNotesErrorEl,
            adminLoginContainerEl: !!adminLoginContainerEl, 
            modalAdminPasswordInputGroupEl: !!modalAdminPasswordInputGroupEl, // 关键检查点
            confirmAdminPasswordInputEl: !!confirmAdminPasswordInputEl,
            confirmAdminPasswordErrorEl: !!confirmAdminPasswordErrorEl // 关键检查点
        });
    }

    // --- State Variables ---
    let currentUsername = '匿名读者'; 
    let localUserId = null; 
    let isAdminLoggedIn = false; // 管理员登录状态

    // --- Utility Functions ---
    function safeLocalStorageGet(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            console.warn("LocalStorage GET Error:", e.message);
            return null;
        }
    }

    function safeLocalStorageSet(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            console.warn("LocalStorage SET Error:", e.message);
        }
    }

    // 定义全局的事件处理函数，以便可以正确地添加和移除
    let currentConfirmHandler = null;
    let currentCancelHandler = null;
    let currentOverlayHandler = null;

    /**
     * 显示自定义确认弹窗
     * @param {string} message 弹窗消息
     * @param {function} onConfirm 用户点击确认后的回调函数 (接收一个参数：用户输入的名字 或 管理员密码)
     * @param {string} authType 'none', 'username', 'adminPassword'
     * @param {string} expectedValue 如果需要认证，期望的值是什么 (用户名或管理员密码)
     */
    function showConfirmationModal(message, onConfirm, authType = 'none', expectedValue = '') {
        console.log("showConfirmationModal called with authType:", authType); // Debug log
        if (!confirmationModalEl || !modalMessageEl || !confirmActionBtnEl || !cancelConfirmBtnEl) {
            console.error("Confirmation modal elements not found!"); // Debug log
            return;
        }

        // 确保所有相关元素都被正确缓存，如果为 null，尝试重新缓存
        if (authType === 'adminPassword' && (!modalAdminPasswordInputGroupEl || !confirmAdminPasswordInputEl || !confirmAdminPasswordErrorEl)) {
            console.error("Admin password modal elements not found during showConfirmationModal. Attempting re-cache."); 
            cacheDOMElements(); // 尝试重新缓存
            if (!modalAdminPasswordInputGroupEl || !confirmAdminPasswordInputEl || !confirmAdminPasswordErrorEl) {
                console.error("Re-caching failed, admin password modal elements are still null. Cannot proceed.");
                return;
            }
        } else if (authType === 'username' && (!modalAuthInputGroupEl || !confirmUsernameInputEl || !confirmAuthErrorEl)) {
             console.error("Username modal elements not found during showConfirmationModal. Attempting re-cache."); 
            cacheDOMElements(); // 尝试重新缓存
            if (!modalAuthInputGroupEl || !confirmUsernameInputEl || !confirmAuthErrorEl) {
                console.error("Re-caching failed, username modal elements are still null. Cannot proceed.");
                return;
            }
        }


        modalMessageEl.textContent = message;
        if (confirmAuthErrorEl) confirmAuthErrorEl.classList.add('hidden'); // 隐藏用户名错误信息
        if (confirmAdminPasswordErrorEl) confirmAdminPasswordErrorEl.classList.add('hidden'); // 隐藏管理员密码错误信息
        if (confirmUsernameInputEl) confirmUsernameInputEl.value = ''; // 清空用户名输入框
        if (confirmAdminPasswordInputEl) confirmAdminPasswordInputEl.value = ''; // 清空管理员密码输入框

        // 默认隐藏所有认证输入组
        if (modalAuthInputGroupEl) modalAuthInputGroupEl.classList.add('hidden'); 
        if (modalAdminPasswordInputGroupEl) modalAdminPasswordInputGroupEl.classList.add('hidden');

        if (authType === 'username') {
            if (modalAuthInputGroupEl) modalAuthInputGroupEl.classList.remove('hidden');
            if (confirmUsernameInputEl) confirmUsernameInputEl.focus();
        } else if (authType === 'adminPassword') {
            if (modalAdminPasswordInputGroupEl) modalAdminPasswordInputGroupEl.classList.remove('hidden');
            if (confirmAdminPasswordInputEl) confirmAdminPasswordInputEl.focus();
        }

        confirmationModalEl.classList.remove('hidden');
        overlayEl.classList.remove('overlay-hidden'); 
        overlayEl.classList.add('overlay-visible');
        
        // 移除旧的事件监听器（如果存在）
        if (currentConfirmHandler) {
            confirmActionBtnEl.removeEventListener('click', currentConfirmHandler);
            cancelConfirmBtnEl.removeEventListener('click', currentCancelHandler);
            overlayEl.removeEventListener('click', currentOverlayHandler);
            console.log("Removed previous modal event listeners."); // Debug log
        }

        // 定义新的事件处理函数
        currentConfirmHandler = () => {
            console.log("Confirm button clicked in modal."); // Debug log
            if (authType === 'username') {
                const enteredUsername = confirmUsernameInputEl.value.trim();
                
                if (enteredUsername === expectedValue) {
                    console.log("Username matched. Executing onConfirm callback."); // Debug log
                    onConfirm(enteredUsername); // 传递名字给回调
                    // hideConfirmationModal(); // hide is called inside onConfirm logic or after
                } else {
                    console.log("Username mismatch."); // Debug log
                    if (confirmAuthErrorEl) confirmAuthErrorEl.classList.remove('hidden');
                    if (confirmUsernameInputEl) confirmUsernameInputEl.focus(); // 重新聚焦
                }
            } else if (authType === 'adminPassword') {
                const enteredPassword = confirmAdminPasswordInputEl.value.trim();
                if (enteredPassword === expectedValue) {
                    console.log("Admin password matched. Executing onConfirm callback."); // Debug log
                    onConfirm(enteredPassword); // 传递密码给回调
                    // hideConfirmationModal(); // hide is called inside onConfirm logic or after
                } else {
                    console.log("Admin password mismatch."); // Debug log
                    if (confirmAdminPasswordErrorEl) confirmAdminPasswordErrorEl.classList.remove('hidden');
                    if (confirmAdminPasswordInputEl) confirmAdminPasswordInputEl.focus();
                }
            } else { // 无认证要求
                console.log("No auth required. Executing onConfirm callback."); // Debug log
                onConfirm();
                // hideConfirmationModal(); // hide is called inside onConfirm logic or after
            }
        };

        currentCancelHandler = () => {
            console.log("Cancel button clicked in modal."); // Debug log
            hideConfirmationModal();
        };

        currentOverlayHandler = (e) => {
            if (e.target === overlayEl) { 
                console.log("Overlay clicked in modal."); // Debug log
                hideConfirmationModal();
            }
        };

        // 添加新的事件监听器
        confirmActionBtnEl.addEventListener('click', currentConfirmHandler);
        cancelConfirmBtnEl.addEventListener('click', currentCancelHandler);
        overlayEl.addEventListener('click', currentOverlayHandler); 
        console.log("Added new modal event listeners."); // Debug log
    }

    function hideConfirmationModal() {
        console.log("hideConfirmationModal called."); // Debug log
        if (!confirmationModalEl) return;
        confirmationModalEl.classList.add('hidden');
        overlayEl.classList.remove('overlay-visible'); 
        overlayEl.classList.add('overlay-hidden');
        
        // 移除当前绑定的事件监听器
        if (currentConfirmHandler) {
            confirmActionBtnEl.removeEventListener('click', currentConfirmHandler);
            cancelConfirmBtnEl.removeEventListener('click', currentCancelHandler);
            overlayEl.removeEventListener('click', currentOverlayHandler);
            currentConfirmHandler = null;
            currentCancelHandler = null;
            currentOverlayHandler = null;
            console.log("Cleaned up modal event listeners."); // Debug log
        }
    }


    /**
     * 获取并显示指定章节/段落的笔记
     * @param {string} id 章节ID或段落ID
     */
    async function fetchAndDisplayNotes(id) {
        console.log("Fetching and displaying notes for ID:", id); // Debug log
        notesDisplayAreaEl.innerHTML = '<p class="text-gray-500 dark:text-gray-400">正在加载笔记...</p>';
        fetchNotesErrorEl.classList.add('hidden');

        try {
            const response = await fetch(`${NOVEL_READER_CONFIG.API_BASE_URL}/api/notes?paragraphId=${id}`);
            if (response.ok) {
                const notes = await response.json();
                notesDisplayAreaEl.innerHTML = ''; 
                console.log("Notes fetched successfully:", notes); // Debug log

                if (notes && notes.length > 0) {
                    notes.forEach(note => {
                        const noteItemEl = document.createElement('div');
                        noteItemEl.className = 'note-item p-4 bg-white dark:bg-gray-700 rounded-md shadow-sm border border-gray-200 dark:border-gray-600 mb-3';
                        noteItemEl.innerHTML = `
                            <div class="flex justify-between items-start mb-2">
                                <div class="text-sm text-gray-500 dark:text-gray-400">
                                    <span class="font-medium text-gray-700 dark:text-gray-200 mr-2">${note.username || '匿名读者'}</span>
                                    <span class="text-xs">${new Date(note.timestamp).toLocaleString()}</span>
                                </div>
                                <div class="flex space-x-2">
                                    <button class="text-blue-500 dark:text-purple-400 hover:text-blue-700 dark:hover:text-purple-300 text-xs font-medium reply-btn" data-note-id="${note.noteId}">回复</button>
                                    <button class="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs font-medium delete-btn" 
                                            data-note-id="${note.noteId}" 
                                            data-paragraph-id="${note.paragraphId}" 
                                            data-username="${note.username}"
                                            data-is-admin-delete="true">删除</button>
                                </div>
                            </div>
                            <p class="text-xs italic text-gray-500 dark:text-gray-400 mb-2 pb-2 border-b border-gray-200 dark:border-gray-600">针对：“${note.selectedText.substring(0,100)}${note.selectedText.length > 100 ? '...' : ''}”</p>
                            <p class="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap">${note.noteContent}</p>
                        `;
                        notesDisplayAreaEl.appendChild(noteItemEl);
                    });

                    // 为新添加的删除和回复按钮绑定事件
                    notesDisplayAreaEl.querySelectorAll('.delete-btn').forEach(button => {
                        console.log("Attaching delete event listener to button:", button); // Debug log
                        button.addEventListener('click', (e) => {
                            console.log("Delete button clicked for note:", e.target.dataset.noteId); // Debug log
                            const noteId = e.target.dataset.noteId;
                            const paragraphId = e.target.dataset.paragraphId;
                            const username = e.target.dataset.username;
                            // 在管理员页面，删除操作总是需要管理员密码
                            showConfirmationModal('请输入管理员密码以确认删除此笔记：', async (adminPassword) => {
                                console.log("Admin delete confirmation received. Calling deleteNoteAdmin."); // Debug log
                                // 管理员删除不需要匹配用户名，直接发送管理员密码
                                await deleteNoteAdmin(noteId, paragraphId, adminPassword); 
                            }, 'adminPassword', NOVEL_READER_CONFIG.ADMIN_PASSWORD); // 认证类型为 'adminPassword'
                        });
                    });
                    notesDisplayAreaEl.querySelectorAll('.reply-btn').forEach(button => {
                        button.addEventListener('click', () => {
                            alert('回复功能暂未实现，需要更复杂的后端和数据结构支持。');
                        });
                    });

                } else {
                    notesDisplayAreaEl.innerHTML = '<p class="text-gray-500 dark:text-gray-400">此章节/段落暂无笔记。</p>';
                }
            } else {
                const errorText = await response.text();
                console.error(`获取笔记失败 (${id}) - 状态码: ${response.status}, 错误: ${errorText}`); // Debug log
                fetchNotesErrorEl.textContent = `加载笔记失败 (${response.status})：${errorText}`;
                fetchNotesErrorEl.classList.remove('hidden');
                notesDisplayAreaEl.innerHTML = '<p class="text-red-500 dark:text-red-400">加载失败。</p>';
            }
        } catch (error) {
            console.error(`获取笔记时发生网络错误 (${id}):`, error); // Debug log
            fetchNotesErrorEl.textContent = `网络错误，无法加载笔记：${error.message}`;
            fetchNotesErrorEl.classList.remove('hidden');
            notesDisplayAreaEl.innerHTML = '<p class="text-red-500 dark:text-red-400">网络错误，无法加载。</p>';
        }
    }

    /**
     * 管理员删除笔记的后端API调用
     * @param {string} noteId 要删除的笔记ID
     * @param {string} paragraphId 笔记所属的段落ID，用于刷新显示
     * @param {string} adminPassword 用户输入的管理员密码
     */
    async function deleteNoteAdmin(noteId, paragraphId, adminPassword) {
        console.log("Calling deleteNoteAdmin for noteId:", noteId, "paragraphId:", paragraphId); // Debug log
        try {
            const response = await fetch(`${NOVEL_READER_CONFIG.API_BASE_URL}/api/notes/${noteId}?paragraphId=${paragraphId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Admin-Password': adminPassword // 发送管理员密码进行后端验证
                }
            });
            console.log("Response from delete API:", response.status, await response.clone().text()); // Debug log

            if (response.ok) {
                console.log(`笔记 ${noteId} 已成功删除。`);
                await fetchAndDisplayNotes(paragraphId); // 重新获取并显示该段落的笔记
                hideConfirmationModal(); // 成功后关闭弹窗
            } else {
                const errorText = await response.text();
                console.error(`删除笔记 ${noteId} 失败: ${response.status} - ${errorText}`); 
                alert(`删除笔记失败: ${errorText || response.statusText}`); 
                hideConfirmationModal(); // 失败也关闭弹窗
            }
        } catch (error) {
            console.error(`删除笔记 ${noteId} 时发生网络错误:`, error);
            alert('删除笔记时发生网络错误。'); 
            hideConfirmationModal(); // 错误也关闭弹窗
        }
    }

    /**
     * 列出所有笔记的段落ID
     */
    async function listAllNoteParagraphIds() {
        console.log("Listing all note paragraph IDs."); // Debug log
        allNotesListEl.innerHTML = '<p class="text-gray-500 dark:text-gray-400">正在加载所有笔记段落ID...</p>';
        listNotesErrorEl.classList.add('hidden');

        try {
            const response = await fetch(`${NOVEL_READER_CONFIG.API_BASE_URL}/api/notes/all-keys`, {
                headers: {
                    'X-Admin-Password': adminPasswordInputEl.value.trim() // 发送管理员密码
                }
            });
            console.log("Response from listAllNotesKeys API:", response.status, await response.clone().text()); // Debug log
            if (response.ok) {
                const keys = await response.json();
                allNotesListEl.innerHTML = '';
                if (keys && keys.length > 0) {
                    keys.forEach(key => {
                        const li = document.createElement('li');
                        li.className = 'py-1 px-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0 flex justify-between items-center';
                        li.innerHTML = `
                            <span>${key}</span>
                            <button class="text-blue-500 dark:text-purple-400 hover:underline text-xs view-notes-by-key-btn" data-key="${key}">查看笔记</button>
                        `;
                        allNotesListEl.appendChild(li);
                    });
                    // 为“查看笔记”按钮绑定事件
                    allNotesListEl.querySelectorAll('.view-notes-by-key-btn').forEach(button => {
                        button.addEventListener('click', (e) => {
                            const key = e.target.dataset.key;
                            noteIdInputEl.value = key.replace('notes:', ''); // 填充到查看输入框
                            fetchNotesBtn.click(); // 触发查看
                        });
                    });

                } else {
                    allNotesListEl.innerHTML = '<p class="text-gray-500 dark:text-gray-400">暂无任何笔记段落ID。</p>';
                }
            } else {
                listNotesErrorEl.textContent = `加载所有笔记ID失败 (${response.status})：${await response.text()}`;
                listNotesErrorEl.classList.remove('hidden');
                allNotesListEl.innerHTML = '<p class="text-red-500 dark:text-red-400">加载失败。</p>';
            }
        } catch (error) {
            console.error('获取所有笔记ID时发生网络错误:', error);
            listNotesErrorEl.textContent = `网络错误，无法加载所有笔记ID：${error.message}`;
            listNotesErrorEl.classList.remove('hidden');
            allNotesListEl.innerHTML = '<p class="text-red-500 dark:text-red-400">网络错误，无法加载。</p>';
        }
    }


    function setupEventListeners() {
        // 管理员登录逻辑
        adminLoginBtn.addEventListener('click', () => {
            console.log('Admin login button clicked.'); // Debug log
            const enteredPassword = adminPasswordInputEl.value.trim();
            if (enteredPassword === NOVEL_READER_CONFIG.ADMIN_PASSWORD) {
                console.log('Admin password correct. Unlocking functions.'); // Debug log
                isAdminLoggedIn = true;
                adminErrorEl.classList.add('hidden');
                document.querySelector('.bg-red-100').classList.add('hidden'); // 隐藏安全警告
                adminLoginContainerEl.classList.add('hidden'); // 使用新ID隐藏登录框
                adminFunctionsEl.classList.remove('hidden'); // 显示管理员功能
            } else {
                console.log('Admin password incorrect.'); // Debug log
                adminErrorEl.classList.remove('hidden');
                adminPasswordInputEl.focus();
            }
        });

        // 允许通过 Enter 键触发管理员登录
        adminPasswordInputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                console.log('Admin password input: Enter key pressed.'); // Debug log
                adminLoginBtn.click();
            }
        });

        // 列出所有笔记段落ID
        listAllNotesBtn.addEventListener('click', listAllNoteParagraphIds);

        // 查看指定笔记
        fetchNotesBtn.addEventListener('click', () => {
            const id = noteIdInputEl.value.trim();
            if (id) {
                fetchAndDisplayNotes(id);
            } else {
                fetchNotesErrorEl.textContent = '请输入章节或段落ID。';
                fetchNotesErrorEl.classList.remove('hidden');
                notesDisplayAreaEl.innerHTML = '<p class="text-gray-500 dark:text-gray-400">请输入ID后点击“查看笔记”来加载。</p>';
            }
        });
        
        // 允许通过 Enter 键触发搜索
        noteIdInputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                fetchNotesBtn.click();
            }
        });

        // ESC键关闭确认弹窗
        document.addEventListener('keydown', (e) => { 
            if (e.key === 'Escape') {
                hideConfirmationModal();
            }
        });
    }

    function init() {
        cacheDOMElements();
        document.getElementById('currentYear').textContent = new Date().getFullYear().toString();

        // 从本地存储加载用户名和本地用户ID
        let savedUsername = safeLocalStorageGet(NOVEL_READER_CONFIG.STORAGE_KEYS.USER_NAME);
        if (savedUsername) {
            currentUsername = savedUsername;
        } else {
            currentUsername = `管理员`; // 后台管理页面的默认名可以更明确
            safeLocalStorageSet(NOVEL_READER_CONFIG.STORAGE_KEYS.USER_NAME, currentUsername);
        }
        usernameDisplayEl.textContent = currentUsername; // 更新顶部的名字显示

        let savedLocalUserId = safeLocalStorageGet(NOVEL_READER_CONFIG.STORAGE_KEYS.LOCAL_USER_ID);
        if (savedLocalUserId) {
            localUserId = savedLocalUserId;
        } else {
            localUserId = crypto.randomUUID(); 
            safeLocalStorageSet(NOVEL_READER_CONFIG.STORAGE_KEYS.LOCAL_USER_ID, localUserId);
        }

        setupEventListeners(); 
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
