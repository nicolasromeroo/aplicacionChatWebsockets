
import express from 'express'
import handlebars from 'express-handlebars'
import __dirname from './utils.js'

import viewsRouter from './routes/views.router.js'

import {Server} from 'socket.io'

const app = express()

const httpServer = app.listen(8080, () => {
    console.log('Escuchando en puerto 8080')
})
const io = new Server(httpServer)

app.engine('handlebars', handlebars.engine())
app.set('views', __dirname + '/views')
app.set('view engine', 'handlebars')

app.use(express.static(__dirname + '/public'))

app.use('/', viewsRouter)

let messages = []

let users = [] 

io.on('connection', socket => {
    console.log("Nuevo cliente conectado")
    
    socket.on('message', (data) => {
        messages.push(data)
        io.emit('messageLogs', messages)
    })

    socket.on('usuarioNuevoConectado', user => {
        users[socket.id] = user
        io.emit('userList', Object.values(users))

        socket.emit('historialDelChat', messages)

        socket.broadcast.emit('newUserConnected', user)
    })

    socket.on('typing', () => {
        socket.broadcast.emit('usuarioEscribiendo', users[socket.id])
    })

    socket.on('disconnect', () => {
        delete users[socket.id]
        io.emit('userList', Object.values(users))
    })

    // otras funcionalidades
    // notificaciones de usuario desconectado
    socket.on('disconnect', () => {
        let user = users[socket.id];
        delete users[socket.id];
        io.emit('userList', Object.values(users));
        if (user) {
            io.emit('userDisconnected', user);
        }
    });
    
    // mensajes privados
    socket.on('privateMessage', ({ toUserId, message }) => {
        socket.to(toUserId).emit('privateMessage', {
            fromUser: users[socket.id],
            message: message
        });
    });

    // sala de chats
    socket.on('joinRoom', (room) => {
        socket.join(room);
        socket.emit('message', { user: 'Sistema', message: `Te has unido a la sala: ${room}` });
    });
    
    socket.on('roomMessage', ({ room, message }) => {
        io.to(room).emit('message', { user: users[socket.id], message: message });
    });
    
    // notificaciones de errores
    socket.on('message', (data) => {
        if (!data.message || data.message.trim() === "") {
            socket.emit('errorMessage', 'El mensaje no puede estar vacío.');
        } else {
            messages.push(data);
            io.emit('messageLogs', messages);
        }
    });
    
    // sistema de reacciones (emojis)
    socket.on('reactToMessage', ({ messageId, reaction }) => {
        let message = messages.find(msg => msg.id === messageId);
        if (message) {
            message.reactions = message.reactions || [];
            message.reactions.push(reaction);
            io.emit('messageReaction', { messageId, reaction });
        }
    });
    
    // // compartir archivos
    // socket.on('sendFile', (file) => {
    //     io.emit('receiveFile', { user: users[socket.id], file: file });
    // });
    
    // mostrar estado de conexion
    io.on('connection', socket => {
        users[socket.id] = { user: "Anonimo" };
        io.emit('userConnected', users[socket.id]);
        socket.on('disconnect', () => {
            io.emit('userDisconnected', users[socket.id]);
            delete users[socket.id];
        });
    });
    
    // compartir ubicacion
    socket.on('shareLocation', (location) => {
        io.emit('receiveLocation', { user: users[socket.id], location: location });
    });
    
    
})