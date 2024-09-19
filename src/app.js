
import express from 'express';
import handlebars from 'express-handlebars';
import __dirname from './utils.js';
import viewsRouter from './routes/views.router.js';
import { Server } from 'socket.io';

const app = express();
const httpServer = app.listen(8080, () => {
    console.log('Escuchando en puerto 8080');
});
const io = new Server(httpServer);

app.engine('handlebars', handlebars.engine());
app.set('views', __dirname + '/views');
app.set('view engine', 'handlebars');

app.use(express.static(__dirname + '/public'));

app.use('/', viewsRouter);

let messages = [];
let users = {};
let tasks = {};

io.on('connection', socket => {
    console.log('Nuevo cliente conectado');

    socket.on('usuarioNuevoConectado', (username) => {
        console.log('Nombre de usuario recibido:', username); // Para depuración
        if (typeof username === 'string' && username.trim()) {
            username = username.trim(); // Limpiar espacios en blanco
            users[socket.id] = username;
            io.emit('userList', Object.values(users));
            socket.emit('historialDelChat', messages);
            socket.broadcast.emit('newUserConnected', { user: username });
        } else {
            console.error('Error: nombre de usuario inválido', username);
            socket.emit('errorMessage', 'Nombre de usuario no proporcionado o inválido');
        }
    });

    socket.on('disconnect', () => {
        if (users[socket.id]) {
            const disconnectedUser = users[socket.id];
            delete users[socket.id];
            io.emit('userDisconnected', `${disconnectedUser} se ha desconectado`);
            io.emit('userList', Object.values(users));
        }
    });
    

    socket.on('message', (data) => {
        if (data.message && data.message.trim() !== "") {
            messages.push({ user: users[socket.id], message: data.message });
            io.emit('messageLogs', messages);
        } else {
            socket.emit('errorMessage', 'El mensaje no puede estar vacío.');
        }
    });

    socket.on('typing', () => {
        socket.broadcast.emit('usuarioEscribiendo', { user: users[socket.id] });
    });

    socket.on('disconnect', () => {
        let user = users[socket.id];
        delete users[socket.id];
        io.emit('userList', Object.values(users));
        if (user) {
            io.emit('userDisconnected', `${user} se ha desconectado del chat`);
        }
    });

    // manejo de tareas
    socket.on('getTasks', () => {
        socket.emit('tasks', Object.values(tasks).flat());
    });

    socket.on('addTask', (task) => {
        if (!tasks[socket.id]) {
            tasks[socket.id] = [];
        }
        tasks[socket.id].push(task);
        io.emit('tasks', Object.values(tasks).flat());
    });

    socket.on('completeTask', (taskId) => {
        let userTasks = tasks[socket.id];
        if (userTasks) {
            userTasks = userTasks.map(task =>
                task.id === taskId ? { ...task, completed: true } : task
            );
            tasks[socket.id] = userTasks;
            io.emit('tasks', Object.values(tasks).flat());
        }
    });

    // mas funciones
    socket.on('toggleTask', (taskId) => {
        let userTasks = tasks[socket.id];
        if (userTasks) {
            userTasks = userTasks.map(task =>
                task.id === taskId ? { ...task, completed: !task.completed } : task
            );
            tasks[socket.id] = userTasks;
            io.emit('tasks', Object.values(tasks).flat());
        }
    });

    socket.on('getTasksForUser', (username) => {
        const userId = Object.keys(users).find(id => users[id] === username);
        const userTasks = tasks[userId] || [];
        socket.emit('tasksForUser', userTasks);
    });
    
    
});
