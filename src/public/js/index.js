
document.addEventListener('DOMContentLoaded', () => {
    const socket = io();

    function promptForUsername() {
        Swal.fire({
            title: 'Bienvenido',
            input: 'text',
            inputLabel: 'Ingresa tu nombre',
            inputPlaceholder: 'Nombre',
            allowOutsideClick: false,
            inputValidator: (value) => {
                if (!value || !value.trim()) {
                    return 'El nombre de usuario no puede estar vacío.';
                }
                return null;
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const username = result.value.trim();
                console.log('Nombre de usuario recibido en cliente:', username); // Para depuración
                if (username) {
                    document.getElementById('username').innerText = username;
                    socket.emit('usuarioNuevoConectado', username);
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'No se ingresó ningún nombre de usuario.'
                    }).then(() => {
                        promptForUsername(); // Volver a solicitar el nombre de usuario
                    });
                }
            }
        });
    }

    promptForUsername();

    const sendMessageButton = document.getElementById('sendMessage');
    const chatboxInput = document.getElementById('chatbox');

    // enviar el mensaje
    const sendMessage = () => {
        const message = chatboxInput.value.trim();
        if (message) {
            socket.emit('message', { message });
            chatboxInput.value = '';
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'El mensaje no puede estar vacío.'
            });
        }
    };

    // evt clic en el botón de enviar
    if (sendMessageButton && chatboxInput) {
        sendMessageButton.addEventListener('click', sendMessage);
    }

    // evt tecla en el campo de entrada del mensaje
    if (chatboxInput) {
        chatboxInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });


        chatboxInput.addEventListener('input', () => {
            socket.emit('typing');
        });
    }

    const addTaskButton = document.getElementById('addTaskButton');
    const taskInput = document.getElementById('taskInput');

    if (addTaskButton && taskInput) {
        addTaskButton.addEventListener('click', () => {
            const task = { id: Date.now(), text: taskInput.value.trim(), completed: false };
            if (taskInput.value.trim()) {
                socket.emit('addTask', task);
                taskInput.value = '';
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'La tarea no puede estar vacía.'
                });
            }
        });
    }

    socket.on('messageLogs', (messages) => {
        const messageLogs = document.getElementById('messageLogs');
        if (messageLogs) {
            messageLogs.innerHTML = '';
            messages.forEach(msg => {
                const messageElement = document.createElement('p');
                messageElement.innerHTML = `<strong>${msg.user}:</strong> ${msg.message}`;
                messageLogs.appendChild(messageElement);
            });
        }
    });

    socket.on('userDisconnected', (message) => {
        Swal.fire({
            icon: 'info',
            title: 'Usuario desconectado',
            text: message,
            toast: true,
            position: 'top-right',
            showConfirmButton: false,
            timer: 5000
        });
    });
    

    socket.on('connect', () => {
        console.log('Conectado al servidor');
    });

    socket.on('disconnect', () => {
        console.log('Desconectado del servidor');
    });



    socket.on('newUserConnected', (data) => {
        Swal.fire({
            text: "Nuevo usuario conectado",
            toast: true,
            position: 'top-right',
            icon: 'info',
            title: `${data.user} se ha unido al chat.`,
            showConfirmButton: false,
            timer: 5000
        });
    });

    socket.on('usuarioEscribiendo', (data) => {
        let objectTyping = document.getElementById('typing');
        if (objectTyping) {
            objectTyping.innerHTML = `${data.user} está escribiendo...`;
            setTimeout(() => {
                objectTyping.innerHTML = '';
            }, 2000);
        }
    });

    // socket.on('userList', (users) => {
    //     const userList = document.getElementById('userList');
    //     if (userList) {
    //         userList.innerHTML = '';
    //         users.forEach(user => {
    //             const userElement = document.createElement('p');
    //             userElement.innerText = user;
    //             userList.appendChild(userElement);
    //         });
    //     }
    // });

    socket.on('userList', (users) => {
        const userSelector = document.getElementById('userSelector');
        if (userSelector) {
            userSelector.innerHTML = '<option value="">Seleccionar usuario</option>'; // Limpiar y agregar opción por defecto
            users.forEach(user => {
                const option = document.createElement('option');
                option.value = user;
                option.textContent = user;
                userSelector.appendChild(option);
            });
        }
    });

    socket.on('historialDelChat', (messages) => {
        const messageLogs = document.getElementById('messageLogs');
        if (messageLogs) {
            messageLogs.innerHTML = '';
            messages.forEach(msg => {
                const messageElement = document.createElement('p');
                messageElement.innerHTML = `<strong>${msg.user}:</strong> ${msg.message}`;
                messageLogs.appendChild(messageElement);
            });
        }
    });

    // socket.on('tasks', (tasks) => {
    //     const tasksList = document.getElementById('tasksList');
    //     if (tasksList) {
    //         tasksList.innerHTML = '';
    //         tasks.forEach(task => {
    //             const taskElement = document.createElement('li');
    //             taskElement.innerText = task.text;
    //             if (task.completed) {
    //                 taskElement.style.textDecoration = 'line-through';
    //             }
    //             tasksList.appendChild(taskElement);
    //         });
    //     }
    // });
    socket.on('tasks', (tasks) => {
        const tasksList = document.getElementById('tasksList');
        if (tasksList) {
            tasksList.innerHTML = '';
            tasks.forEach(task => {
                const taskElement = document.createElement('li');
                taskElement.innerText = task.text;
                if (task.completed) {
                    taskElement.style.textDecoration = 'line-through';
                }
                taskElement.addEventListener('click', () => {
                    socket.emit('toggleTask', task.id);
                });
                tasksList.appendChild(taskElement);
            });
        }
    });

    socket.emit('getTasks');

    const userSelector = document.getElementById('userSelector');

userSelector.addEventListener('change', (event) => {
    const selectedUser = event.target.value;
    socket.emit('getTasksForUser', selectedUser);
});

socket.on('tasksForUser', (tasks) => {
    const tasksList = document.getElementById('tasksList');
    if (tasksList) {
        tasksList.innerHTML = '';
        tasks.forEach(task => {
            const taskElement = document.createElement('li');
            taskElement.innerText = task.text;
            if (task.completed) {
                taskElement.style.textDecoration = 'line-through';
            }
            taskElement.addEventListener('click', () => {
                socket.emit('toggleTask', task.id);
            });
            tasksList.appendChild(taskElement);
        });
    }
});
});
