
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
    socket.emit('userAuthenticated', {user: user})
})

chatBox.addEventListener('keyup', (evt) => {
    if (evt.key === 'Enter') {
        if (chatBox.value.trim().length) {
            socket.emit('message', { user: user, message: chatBox.value })
            chatBox.value = ''
        }
    }
})

socket.on('messageLogs', (data) => {
    let log = document.getElementById('messageLogs')
    let messagesHtml = ""
    data.forEach(message => {
        messagesHtml += `${message.user} dice: ${message.message}<br>`
    })
    log.innerHTML = messagesHtml
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
