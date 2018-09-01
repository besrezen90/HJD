'use strict'
const wrap = document.querySelector('.wrap.app'),
    menu = wrap.querySelector('.menu'),
    currentImage = wrap.querySelector('.current-image'),
    error = wrap.querySelector('.error'),
    imageLoader = wrap.querySelector('.image-loader');

let dragMenu = null; // Переменная для перетаскивания меню
let currentColor = "#6ebf44";
let newImageMask;
let newImageMaskHeight;
let isDrawing = false;
let connection;
let newCommentId;
let serverId;
let canvas;
let ctx;

const menuSize = menu.offsetHeight;
const homeUrl = window.location.origin + `/index.html`;
let uploadStatus = false; //Статус загружалось ли ранее изображение для перехода в режим поделится


/* Генерация ошибки */ 
function showError(string) {
    error.classList.remove('hidden')
    error.querySelector('.error__message').textContent = string;
}
/* Функция удаления ошибки при нажатии на "бургер" */
function removeError() {
    error.classList.add('hidden');
}

/* GET запрос для по ID */

function loadInformFromId(id) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `https://neto-api.herokuapp.com/pic/${id}`)
    xhr.send();

    xhr.addEventListener('load', () => {
        let newImage = JSON.parse(xhr.responseText);
        /* Выбор открывающегося меню - поделиться или комментирование */
        choiceMenu();
        /* функция добавляет в изображение src */
        loadImage(newImage);
        /* WSS */
        wss(newImage.id);
        /* функция загружает свежие комментарии */
    })
}
/* Выбор открывающегося меню - поделиться или комментирование */
function choiceMenu() {
    if (uploadStatus) {
        uploadStatus = false;
        reloadStatus('default');
            menu.querySelector('.share').click();
        } else {
            reloadStatus('default')
            menu.querySelector('.comments').click();
        }
}
function changeUrlNew(id) {
    menu.querySelector('.menu__url').value = window.location.origin + `/index.html?${id}`;
}

/* функция добавляет в изображение src */

function loadImage(obj) {
    if (obj.url) {
        sessionStorage.id = obj.id;
        sessionStorage.url = obj.url;
        currentImage.src = obj.url;
        currentImage.dataset.load = 'load';
        currentImage.addEventListener('load', (event) => {
            createCanvas()
        })
    } else return
}

/* Создаем изображение с маской */
function createNewImageMask(url) {
    if (!wrap.querySelector('.image-mask')) {
        let newImage = document.createElement('img');
        newImage.classList.add('image-mask');
        wrap.appendChild(newImage);
        wrap.insertBefore(currentImage, wrap.querySelector('.image-mask'));
    }

    if (!url) {
        wrap.querySelector('.image-mask').setAttribute('src', " ");
        wrap.querySelector('.image-mask').classList.add('hidden');
    } else {
        wrap.querySelector('.image-mask').setAttribute('src', url);
        wrap.querySelector('.image-mask').classList.remove('hidden');
        wrap.querySelector('.image-mask').addEventListener('load', (e) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        })
    }
}

/* Создаем канвас */
function createCanvas() {
    const drawArea = document.createElement('canvas');
    drawArea.classList.add('canvas-area');
    wrap.appendChild(drawArea);
    wrap.insertBefore(currentImage, wrap.querySelector('.canvas-area'));
    drawArea.width = currentImage.width;
    drawArea.height = currentImage.height;
    canvas = wrap.querySelector('.canvas-area');
    ctx = canvas.getContext('2d');


    function startDrawing(e) {
        if (menu.querySelector('.menu__item.mode.draw').dataset.state === "selected") isDrawing = true;
        ctx.strokeStyle = currentColor;
        ctx.beginPath();
        ctx.moveTo(e.pageX - canvas.getBoundingClientRect().left, e.pageY - canvas.getBoundingClientRect().top);
    }

    function draw(e) {
        if (isDrawing == true) {
            var x = e.pageX - canvas.getBoundingClientRect().left;
            var y = e.pageY - canvas.getBoundingClientRect().top;
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    }

    function stopDrawing() {
        if (isDrawing) sendMaskState();
        isDrawing = false;

    }

    function sendMaskState() {
        canvas.toBlob(function (blob) {
            connection.send(blob);

        });
    }

    drawArea.addEventListener('mousedown', startDrawing);
    drawArea.addEventListener('mouseup', stopDrawing);
    drawArea.addEventListener('mouseout', stopDrawing);
    drawArea.addEventListener('mousemove', draw);
}
/* Открываем webSocket */
function wss(id) {
    /* Необходимо разобраться с тем как правильно отрабатывают события веб соккета */
    serverId = id;
    connection = new WebSocket(`wss://neto-api.herokuapp.com/pic/${id}`);
    connection.addEventListener('message', event => {
        if (JSON.parse(event.data).event === 'pic') {
            if(JSON.parse(event.data).pic.comments) {
                const comments = JSON.parse(event.data).pic.comments
                for (let key in comments) {
                    upgrateComment(comments[key])
                }
                wrap.querySelectorAll('.comments__marker-checkbox').forEach(elem => elem.checked = false);
            }
            if (JSON.parse(event.data).pic.mask) {
                createNewImageMask(JSON.parse(event.data).pic.mask)
            } else {
                createNewImageMask()
            }
        }
        if (JSON.parse(event.data).event === 'mask') {
            createNewImageMask(JSON.parse(event.data).url)
        }
        if (JSON.parse(event.data).event === 'comment') {
            wrap.querySelectorAll('.loader').forEach(elem => elem.classList.add('hidden'));
            upgrateComment(JSON.parse(event.data).comment)

        }
    });
}

/* Создание Input для загрузки изображения + Загрузка Drag&Drop + POST запрос для загрузки на сервер */
function updateFilesInfo(files) {

    if (files[0].type !== "image/png" && files[0].type !== "image/jpeg") {
        showError('Неверный формат файла. Пожалуйста, выберите изображение в формате .jpg или .png.')        
        return
    }
    sendFile(files[0])
}

function sendFile(file) {

    wrap.querySelectorAll('.comments__form').forEach(elem => elem.remove())

    const formData = new FormData();
    formData.append('title', file.name);
    formData.append('image', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://neto-api.herokuapp.com/pic', true);



    xhr.addEventListener('loadstart', (event) => {
        removeError()
        imageLoader.style.display = 'block';
    })
    xhr.addEventListener('loadend', () => {
        if (xhr.status !== 200) {
            showError('Проблемы с загрузкой изображения, попробуйте позже')
        }
        imageLoader.style.display = 'none';
    })

    xhr.addEventListener('load', (event) => {
        if (xhr.status === 200) {
            let newCurrentImage = JSON.parse(xhr.responseText);
            sessionStorage.newId = newCurrentImage.id;
            changeUrlNew(newCurrentImage.id)
            loadInformFromId(newCurrentImage.id)
        } else console.log('error')
    })


    xhr.send(formData);

}

function createNewInput() {
    const newInput = document.createElement('input');
    newInput.setAttribute('type', 'file');
    // newInput.setAttribute('accept', 'image/jpeg, image/png');
    newInput.setAttribute('class', 'downloadFile');
    newInput.style.position = 'absolute';
    newInput.style.display = 'block';
    newInput.style.top = '0px';
    newInput.style.left = '0px';
    newInput.style.height = `${document.querySelector('.menu__item.mode.new').offsetHeight}px`;
    newInput.style.width = `${document.querySelector('.menu__item.mode.new').offsetWidth}px`;
    newInput.style.opacity = '0';

    newInput.addEventListener('change', onSelectFiles);

    function onSelectFiles(event) {
        const files = Array.from(event.currentTarget.files);
        updateFilesInfo(files);
    }


    document.querySelector('.menu__item.mode.new').appendChild(newInput);
}
document.addEventListener('DOMContentLoaded', createNewInput)

/* Drag&Drop изображения */
function onFilesDrop(event) {
    event.preventDefault();

    const files = Array.from(event.dataTransfer.files);

    if (currentImage.dataset.load === 'load') {
        showError('Чтобы загрузить новое изображение, пожалуйста, вопсользуйтесь пунктом «Загрузить новое» в меню.');
        return;
    }
    updateFilesInfo(files);
}

wrap.addEventListener('drop', onFilesDrop);
wrap.addEventListener('dragover', event => event.preventDefault());



/* Изменение состояния приложения и меню */
function reloadStatus(string) {
    menu.querySelector('.burger').style.display = 'none'

    wrap.dataset.state = string
    if (string === 'default') {
        menu.dataset.state = 'default';
        menu.querySelectorAll('[data-state]').forEach(item => item.dataset.state = '');
    }
    if (string === 'initial') {
        menu.dataset.state = 'initial';
        menu.querySelectorAll('[data-state]').forEach(item => item.dataset.state = '')
    }
    if (string === 'selected') {
        menu.querySelector('.burger').style.display = ''
        menu.dataset.state = 'selected'
    }
}

/* Проверка наличия ранее загруженного изображения или наличия ID в ссылке*/
function requestImageInfo() {
    const str = window.location.href;
    const regex = /\?(.*)/;
    let id = str.match(regex)
    if (id) {
        changeUrlNew(id[1])
        loadInformFromId(id[1]);
    } else if (sessionStorage.id) {
        changeUrlNew(sessionStorage.id)
        loadInformFromId(sessionStorage.id)
        reloadStatus('default')
    } else {
        reloadStatus('initial')
    }
}

document.addEventListener('DOMContentLoaded', requestImageInfo)

/* Проверка наличия прошлого состояния меню */

function requestLastMenuPosition() {
    if (localStorage.x && localStorage.y) {
        menu.style.setProperty('--menu-left', `${localStorage.x}px`)
        menu.style.setProperty('--menu-top', `${localStorage.y}px`)
    } else return
}

document.addEventListener('DOMContentLoaded', requestLastMenuPosition)


/* Обработчик клика по меню */
menu.addEventListener('click', event => {
    const burgerMenu = menu.querySelector('.burger'),
        modeMenuAll = menu.querySelectorAll('[data-state]'),
        modeComments = menu.querySelector('.comments'),
        modeCommentsAll = wrap.querySelectorAll('.comments__form'),
        modeDraw = menu.querySelector('.draw'),
        modeShare = menu.querySelector('.share'),
        modeCopy = menu.querySelector('.menu_copy'),
        modeToggle = menu.querySelectorAll('.menu__toggle');



    if (event.target === burgerMenu || event.target.parentNode === burgerMenu) {
        reloadStatus('default')
    }
    if (event.target === modeComments || event.target.parentNode === modeComments) {
        modeMenuAll.forEach(item => item.dataset.state = " ");
        modeComments.dataset.state = 'selected';
        reloadStatus('selected')
    }
    if (event.target === modeDraw || event.target.parentNode === modeDraw) {
        modeMenuAll.forEach(item => item.dataset.state = " ");
        modeDraw.dataset.state = 'selected';
        reloadStatus('selected')
    }
    if (event.target === modeShare || event.target.parentNode === modeShare) {
        modeMenuAll.forEach(item => item.dataset.state = " ");
        modeShare.dataset.state = 'selected';
        reloadStatus('selected')
    }
    if (event.target === modeCopy) {
        menu.querySelector('.menu__url').select();
        try {
            let successful = document.execCommand('copy');
            let msg = successful ? 'успешно ' : 'не';
            console.log(`URL ${msg} скопирован`);
        } catch (err) {
            console.log('Ошибка копирования');
        }
        window.getSelection().removeAllRanges();
    }
    if (event.target === modeToggle[0] || event.target === modeToggle[1]) {
        if (event.target.value === 'off') {
            modeCommentsAll.forEach(elem => elem.classList.add('hidden'))
        }
        if (event.target.value === 'on') {
            modeCommentsAll.forEach(elem => elem.classList.remove('hidden'))
        }
    }
    if (event.target.classList.contains('menu__color')) {
        menu.querySelectorAll('.menu__color').forEach(elem => {
            if (elem.hasAttribute('checked')) elem.removeAttribute('checked')
        })
        event.target.setAttribute('checked', 'checked');
        switch (event.target.value) {
            case 'red':
                currentColor = '#eb5d56'
                break;
            case 'yellow':
                currentColor = '#f4d22f'
                break;
            case 'green':
                currentColor = '#6ebf44'
                break;
            case 'blue':
                currentColor = '#52a7f7'
                break;
            case 'purple':
                currentColor = '#b36ae0'
                break;
            default:
                currentColor = '#6ebf44'
                break;
        }
    }
    if(!error.classList.contains('hidden'))  removeError();
    checkMenuBody(event.currentTarget, event.currentTarget.getBoundingClientRect().left)
})

/* Проверка меню на состояние */

function checkMenuBody(block, x) {
    if(block.offsetHeight > menuSize) {
        x--
        menu.style.setProperty('--menu-left', x + 'px')
        checkMenuBody(block, x)
    } else return
}

/* Перетаскивание меню */

menu.firstElementChild.addEventListener('mousedown', event => {
    dragMenu = event.currentTarget;
})

document.addEventListener('mousemove', event => {
    event.preventDefault()
    if(dragMenu) {
        if (event.pageX < 0 + dragMenu.offsetWidth) {
            menu.style.setProperty('--menu-left', 0 + 'px')
            localStorage.x = 0;
        } else if (event.pageX + menu.offsetWidth > document.documentElement.clientWidth - dragMenu.offsetWidth - 1) {
            menu.style.setProperty('--menu-left', document.documentElement.clientWidth - menu.offsetWidth - 1 + 'px')
            localStorage.x = document.documentElement.clientWidth - menu.offsetWidth - 1;
        } else {
            menu.style.setProperty('--menu-left', event.pageX - (dragMenu.offsetWidth / 2) + 'px')
            localStorage.x = event.pageX - (dragMenu.offsetWidth / 2);
        }
        if (event.pageY < 0 + dragMenu.offsetHeight) {
            menu.style.setProperty('--menu-top', 0 + 'px')
            localStorage.y = 0;
        } else if (event.pageY + (menu.offsetHeight / 2) > document.documentElement.clientHeight - (dragMenu.offsetHeight / 2)) {
            menu.style.setProperty('--menu-top', document.documentElement.clientHeight - dragMenu.offsetHeight + 'px')
            localStorage.y = document.documentElement.clientHeight - dragMenu.offsetHeight;
        } else {
            menu.style.setProperty('--menu-top', event.pageY - (dragMenu.offsetHeight / 2) + 'px')
            localStorage.y = event.pageY - (dragMenu.offsetHeight / 2);
        }
    }
})


menu.firstElementChild.addEventListener('mouseup', event => {
    dragMenu = null;
})

/* Обработчик клика по холсту для создания комментария */ 
wrap.addEventListener('click', (e) => {
    if(e.target === wrap.querySelector('canvas') && menu.querySelector('.menu__item.mode.comments').dataset.state === 'selected') {

        if(wrap.querySelector('[data-comment-id]')) {
            wrap.querySelectorAll('[data-comment-id]').forEach(elem => {
                if(!elem.querySelector('p')) elem.remove()
            })
            addNewFormComment(e.pageX, e.pageY);
        } else addNewFormComment(e.pageX, e.pageY)

    }
})

/* Проверка комментариев */
function upgrateComment(obj) {
    if(wrap.querySelector(`.comments__form[data-comment-id='${obj.left + '&' + obj.top}']`)) {
        const cont = wrap.querySelector(`.comments__form[data-comment-id='${obj.left + '&' + obj.top}']`);
        addNewComment(obj.message, obj.timestamp, cont);
    } else {
        addNewFormComment(obj.left, obj.top);
        upgrateComment(obj);
    }
}

/* Создание новвой формы комментариев */ 
function addNewFormComment (x, y) {
    const form = document.createElement('form');
    form.classList.add('comments__form');
    form.style.left = `${x}px`;
    form.style.top = `${y}px`;
    form.dataset.left = x;
    form.dataset.top = y;
    form.style.zIndex = '4';

    const id = x + '&' + y;
    newCommentId = id;
    form.dataset.commentId = id;

    const spanMarker = document.createElement('span');
    spanMarker.classList.add('comments__marker');
    form.appendChild(spanMarker);

    form.addEventListener('submit', sendMessage);
    form.addEventListener('keydown', keySendMessage)

    const inputMarker = document.createElement('input');
    inputMarker.setAttribute('type', 'checkbox');
    inputMarker.checked = true;
    inputMarker.classList.add('comments__marker-checkbox');

    form.appendChild(inputMarker);

    const divBody = document.createElement('div');
    divBody.classList.add('comments__body');
    form.appendChild(divBody);

    const commentBox = document.createElement('div');
    commentBox.classList.add('comment');
    divBody.appendChild(commentBox);

    const loader = document.createElement('div');
    loader.classList.add('loader');
    loader.classList.add('hidden')
    commentBox.appendChild(loader);

    
    for (let i = 0; i < 5; i++) {
        const loadSpan = document.createElement('span');
        loader.appendChild(loadSpan);
    }

    const textArea = document.createElement('textarea');
    textArea.classList.add('comments__input');
    textArea.setAttribute('type', 'text');
    textArea.setAttribute('placeholder', 'Напишите ответ...');
    divBody.appendChild(textArea);

    const inputClose = document.createElement('input');
    inputClose.classList.add('comments__close');
    inputClose.setAttribute('type', 'button');
    inputClose.setAttribute('value', 'Закрыть');
    divBody.appendChild(inputClose);

    const inputSubmit = document.createElement('input');
    inputSubmit.classList.add('comments__submit');
    inputSubmit.setAttribute('type', 'submit');
    inputSubmit.setAttribute('value', 'Отправить');
    divBody.appendChild(inputSubmit);

    form.addEventListener('click', (e) => {
        if(event.target.classList.contains('comments__close') && event.currentTarget.querySelector('p')) {
            event.currentTarget.querySelector('.comments__marker-checkbox').checked = false;
        }
        if(event.target.classList.contains('comments__close') && !event.currentTarget.querySelector('p')) {
            event.currentTarget.remove();
        }
    })
    wrap.appendChild(form)

}
/* Создание нового блока комментариев */
function addNewComment (text, time, cont) {
    const comment = document.createElement('div');
    comment.classList.add('comment');

    const newtime = document.createElement('p');
    newtime.classList.add('comment__time');
    const d = new Date(time);
    newtime.textContent = `${formatData(d.getDate())}:${formatData(d.getMonth() + 1)}:${formatData(d.getFullYear())} ${formatData(d.getHours())}:${formatData(d.getMinutes())}:${formatData(d.getSeconds())}`;
    comment.appendChild(newtime);

    const newMessage = document.createElement('p');
    newMessage.classList.add('comment__message');
    newMessage.textContent = text;
    comment.appendChild(newMessage);

    cont.querySelector('.comments__body').insertBefore(cont.querySelector('.comments__body').appendChild(comment), cont.querySelector('.loader').parentNode)
}
/* Формат даты */
function formatData(data) {
    if (data < 10) {
        return '0' + data;
    } else return data;
}

/* Отправка нового сообщения */

function keySendMessage(event) {
    if (event.repeat) { return; }
		if (!event.ctrlKey) { return; }

		switch (event.code) {
			case 'Enter':
            sendMessageFormPress(event.currentTarget)
			break;
		}
}

function sendMessage(event) {
    if (event) {
        event.preventDefault();
    }
    const message = event.target.querySelector('.comments__input').value;
    const messageForm = `message=${encodeURIComponent(message)}&left=${encodeURIComponent(event.target.dataset.left)}&top=${encodeURIComponent(event.target.dataset.top)}`;
    if(message.length > 0) sendMessageForm(messageForm);
    else return;
    event.target.querySelector('.loader').classList.remove('hidden');
    event.target.querySelector('.comments__input').value = '';

}

function sendMessageFormPress(form) {
    const message = form.querySelector('.comments__input').value;
    const messageForm = `message=${encodeURIComponent(message)}&left=${encodeURIComponent(form.dataset.left)}&top=${encodeURIComponent(form.dataset.top)}`;
    if(message.length > 0) sendMessageForm(messageForm);
    else return;
    form.querySelector('.loader').classList.remove('hidden');
    form.querySelector('.comments__input').value = '';
}

function sendMessageForm(form) {
	fetch(`https://neto-api.herokuapp.com/pic/${serverId}/comments`, {
			method: 'POST',
			body: form,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
		})
		.then( res => {
			if (res.status >= 200 && res.status < 300) {
				return res;
			}
			throw new Error (res.statusText);
		})
		.then(res => res.json())
		.catch(er => {
            console.log(er)
        });	
}


