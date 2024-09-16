
const socket = io()

let user
let chatBox = document.getElementById('chatbox')

Swal.fire({
    title: "Identificarse",
    input: 'text',
    text: "Ingresa tu usuario para identificarte en el chat",
    inputValidator: (value) => {
        return !value && 'Necesitas escribir un nombre para ingresar.'
    },
    allowOutsideClick: false
}).then(result => {
    user = result.value
    document.getElementById('username').textContent = user
    socket.emit('usuarioNuevoConectado', { user: user })
})

chatBox.addEventListener('keyup', (evt) => {
    if (evt.key === 'Enter') {
        if (chatBox.value.trim().length) {
            socket.emit('message', { user: user, message: chatBox.value })
            chatBox.value = ''
        }
    }
})

chatBox.addEventListener('input', () => {
    socket.emit('typing')
})

socket.on('messageLogs', (data) => {
    let log = document.getElementById('messageLogs')
    let messagesHtml = ""
    data.forEach(message => {
        messagesHtml += `${message.user} dice: ${message.message}<br>`
    })
    log.innerHTML = messagesHtml
})

socket.on('userList', (data) => {
    let userList = document.getElementById('userList')
    let userHtml = ""
    data.forEach(user => {
        userHtml += `${user.user} <br>`
    })
    userList.innerHTML = userHtml
})

socket.on('newUserConnected', newUser => {
    Swal.fire({
        text: "Nuevo usuario conectado",
        toast: true,
        position: 'top-right',
        icon: 'info',
        title: `${newUser.user} se ha unido al chat.`,
        showConfirmButton: false,
        timer: 5000
    })
})

socket.on('usuarioEscribiendo', (user) => {
    let objectTyping = document.getElementById('typing')
    objectTyping.innerHTML = user.user + ' esta escribiendo...'

})

// otras funciones
// notificaciones de usuario desconectado
socket.on('userDisconnected', (user) => {
    Swal.fire({
        text: `${user} se ha desconectado.`,
        toast: true,
        position: 'top-right',
        icon: 'warning',
        showConfirmButton: false,
        timer: 3000
    });
});

// enviar msj privado

function sendPrivateMessage(toUserId, message) {
    socket.emit('privateMessage', { toUserId: toUserId, message: message });
}
// recibir msj privados
socket.on('privateMessage', (data) => {
    Swal.fire({
        text: `Mensaje privado de ${data.fromUser}: ${data.message}`,
        toast: true,
        position: 'top-right',
        icon: 'info',
        showConfirmButton: true
    });
});

// unirse a una sala
socket.emit('joinRoom', 'Sala1');
// enviar msj a una sala
function sendRoomMessage(room, message) {
    socket.emit('roomMessage', { room: room, message: message });
}

// notificacion de errores
socket.on('errorMessage', (error) => {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error,
    });
});

// enviar reaccion
function reactToMessage(messageId, reaction) {
    socket.emit('reactToMessage', { messageId: messageId, reaction: reaction });
}
// recibir reaccion
socket.on('messageReaction', ({ messageId, reaction }) => {
    // Mostrar la reacción al mensaje correspondiente
    let messageElement = document.querySelector(`[data-id="${messageId}"]`);
    if (messageElement) {
        messageElement.innerHTML += ` <span>${reaction}</span>`;
    }
});

// // enviar archivo
// document.getElementById('fileInput').addEventListener('change', function () {
//     let file = this.files[0];
//     let reader = new FileReader();
//     reader.onload = function (e) {
//         socket.emit('sendFile', e.target.result);
//     };
//     reader.readAsDataURL(file);
// });
// // recibir archivo
// socket.on('receiveFile', (data) => {
//     let log = document.getElementById('messageLogs');
//     log.innerHTML += `${data.user} ha enviado un archivo: <a href="${data.file}" download="file">Descargar</a><br>`;
// });

socket.on('userConnected', (user) => {
    document.getElementById('status').innerHTML = `${user.user} se ha conectado`;
});

socket.on('userDisconnected', (user) => {
    document.getElementById('status').innerHTML = `${user.user} se ha desconectado`;
});

// compartir ubicacion
navigator.geolocation.getCurrentPosition((position) => {
    socket.emit('shareLocation', {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
    });
});
// recibir ubicacion





