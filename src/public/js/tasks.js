
const socket = io();

// Cargar tareas al conectar
socket.emit('getTasks');

socket.on('tasks', (tasks) => {
    let taskList = document.getElementById('taskList');
    taskList.innerHTML = "";
    tasks.forEach(task => {
        taskList.innerHTML += `<li data-id="${task.id}">${task.text} <button onclick="completeTask('${task.id}')">Completar</button></li>`;
    });
});

// Enviar una nueva tarea
document.getElementById('taskForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const taskInput = document.getElementById('taskInput');
    socket.emit('addTask', { id: Date.now().toString(), text: taskInput.value });
    taskInput.value = '';
});

// Completar una tarea
function completeTask(taskId) {
    socket.emit('completeTask', taskId);
}
