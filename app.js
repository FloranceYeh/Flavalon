document.addEventListener('DOMContentLoaded', () => {
    // === 1. 时间与日期 ===
    const timeEl = document.getElementById('current-time');
    const dateEl = document.getElementById('current-date');

    function updateTime() {
        const now = new Date();
        const timeHTML = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
        const dateStr = now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
        
        timeEl.textContent = timeHTML;
        dateEl.textContent = dateStr;
    }
    setInterval(updateTime, 1000);
    updateTime();

    // === 2. 天气获取 (基于 Open-Meteo API，无需 Key) ===
    const weatherInfoEl = document.getElementById('weather-info');
    const weatherIconEl = document.getElementById('weather-icon');
    const getWeatherBtn = document.getElementById('get-weather-btn');

    // WMO 天气代码转换图标
    const weatherCodes = {
        0: '☀️', // 晴
        1: '🌤️', 2: '⛅', 3: '☁️', // 多云系
        45: '🌫️', 48: '🌫️', // 雾
        51: '🌧️', 53: '🌧️', 55: '🌧️', // 毛毛雨
        61: '☔', 63: '☔', 65: '☔', // 雨
        71: '❄️', 73: '❄️', 75: '❄️', // 雪
        95: '⛈️', 96: '⛈️', 99: '⛈️' // 雷暴
    };

    async function fetchWeather(lat, lon) {
        try {
            weatherInfoEl.textContent = '获取中...';
            const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
            const res = await fetch(url);
            const data = await res.json();
            const current = data.current_weather;
            
            weatherInfoEl.textContent = `${current.temperature}°C`;
            weatherIconEl.textContent = weatherCodes[current.weathercode] || '🌡️';
        } catch (error) {
            weatherInfoEl.textContent = '获取失败';
        }
    }

    getWeatherBtn.addEventListener('click', () => {
        if ('geolocation' in navigator) {
            weatherInfoEl.textContent = '定位中...';
            navigator.geolocation.getCurrentPosition(
                (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
                (err) => { weatherInfoEl.textContent = '定位失败/授权被距'; }
            );
        } else {
            weatherInfoEl.textContent = '浏览器不支持定位';
        }
    });

    // === 3. 待办事项管理 (基于 LocalStorage) ===
    const todoInput = document.getElementById('todo-input');
    const addBtn = document.getElementById('add-todo-btn');
    const todoList = document.getElementById('todo-list');

    let todos = JSON.parse(localStorage.getItem('my_todos')) || [];

    function saveTodos() {
        localStorage.setItem('my_todos', JSON.stringify(todos));
    }

    function renderTodos() {
        todoList.innerHTML = '';
        todos.forEach((todo, index) => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
            
            li.innerHTML = `
                <div class="todo-content" onclick="toggleTodo(${index})">
                    <input type="checkbox" ${todo.completed ? 'checked' : ''}>
                    <span>${todo.text}</span>
                </div>
                <button class="delete-btn" onclick="deleteTodo(${index})">删除</button>
            `;
            todoList.appendChild(li);
        });
    }

    window.toggleTodo = function(index) {
        todos[index].completed = !todos[index].completed;
        saveTodos();
        renderTodos();
    };

    window.deleteTodo = function(index) {
        todos.splice(index, 1);
        saveTodos();
        renderTodos();
    };

    function addTodo() {
        const text = todoInput.value.trim();
        if (text) {
            todos.push({ text, completed: false });
            todoInput.value = '';
            saveTodos();
            renderTodos();
        }
    }

    addBtn.addEventListener('click', addTodo);
    todoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addTodo();
    });

    renderTodos();

    // === 4. 每日小记 (基于 LocalStorage 自动保存) ===
    const notesEl = document.getElementById('daily-notes');
    const statusEl = document.getElementById('save-status');
    const clearNotesBtn = document.getElementById('clear-notes-btn');

    // 以每天的日期作为 Key，例如 "notes_2023-10-01"
    const todayKey = 'notes_' + new Date().toISOString().split('T')[0];
    
    // 加载今天的笔记
    notesEl.value = localStorage.getItem(todayKey) || '';

    let saveTimeout;
    notesEl.addEventListener('input', () => {
        clearTimeout(saveTimeout);
        statusEl.style.opacity = 0; // 隐藏已保存提示
        
        saveTimeout = setTimeout(() => {
            localStorage.setItem(todayKey, notesEl.value);
            statusEl.textContent = '已自动保存于 ' + new Date().toLocaleTimeString('zh-CN');
            statusEl.style.opacity = 1;
        }, 1000); // 停止打字 1 秒后自动保存
    });

    clearNotesBtn.addEventListener('click', () => {
        if (confirm('确定要清空今天的笔记吗？')) {
            notesEl.value = '';
            localStorage.removeItem(todayKey);
            statusEl.textContent = '已清空';
            statusEl.style.opacity = 1;
        }
    });

});