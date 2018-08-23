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




/* GET запрос для по ID */

function loadInformFromId(id) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', `https://neto-api.herokuapp.com/pic/${id}`)
    xhr.send();

    xhr.addEventListener('load', () => {
        let newImage = JSON.parse(xhr.responseText);
        /* функция меняет ссылку в "поделится" */
        changeUrl(newImage)
        /* функция добавляет в изображение src */
        loadImage(newImage);
        /* WSS */
        wss(newImage.id);
        /* функция загружает свежую маску */
        loadMask(newImage)
        /* функция загружает свежие комментарии */
    })
}

/* функция меняет ссылку в "поделится" */

function changeUrl(obj) {
    const str = window.location.href;
    const regex = /\?(.*)/;
    let id = str.match(regex)
    if (id) {
        let url = window.location.href;
        menu.querySelector('.menu__url').value = url;
    } else if (obj.id) {
        let url = window.location.href;
        menu.querySelector('.menu__url').value = url + `?${obj.id}`;
    } else return
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
        reloadStatus('default')
        menu.querySelector('.share').click();
    } else return
}

/* функция загружает свежую маску */

function loadMask(obj) {
    if (typeof obj === 'object' && obj.mask) {
        createNewImageMask(obj)
        console.log('маска нашлась - загружаю и открываю вебсокет')
    }
    if (typeof obj === 'string') {
        wrap.querySelector('.image-mask').src = obj;
        wrap.querySelector('.image-mask').classList.remove('hidden')
    } else {
        console.log('маски нет, создан пустой канвас и открыт веб сокет')
    }
}
/* Создаем изображение с маской */
function createNewImageMask(obj) {
    if (!wrap.querySelector('.image-mask')) {
        let newImage = document.createElement('img');
        newImage.classList.add('image-mask');
        newImage.setAttribute('src', obj.mask);
        wrap.appendChild(newImage)
        wrap.insertBefore(currentImage, wrap.querySelector('.image-mask'))
    } else {
        console.log('изменяем существующий скрытый img и делаем его видимым')
        wrap.querySelector('.image-mask').src = obj.mask;
        wrap.querySelector('.image-mask').classList.remove('hidden')
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
    const canvas = wrap.querySelector('.canvas-area');
    const ctx = canvas.getContext('2d');


    function startDrawing(e) {
        isDrawing = true;
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
            console.log('отправили и очистили')
            ctx.clearRect(0, 0, canvas.width, canvas.height);
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
    connection = new WebSocket(`wss://neto-api.herokuapp.com/pic/${id}`);
    connection.addEventListener('message', event => {
        if (JSON.parse(event.data).event === 'pic') {
            if (JSON.parse(event.data).pic.mask) {
                loadMask(JSON.parse(event.data).pic.mask)
            } else {
                console.log('создаем img и делаем его скрытым')
                let newImage = document.createElement('img');
                newImage.classList.add('image-mask');
                newImage.setAttribute('src', '');
                newImage.classList.add('hidden')
                wrap.appendChild(newImage)
                wrap.insertBefore(currentImage, wrap.querySelector('.image-mask'))
            }
        }
        if (JSON.parse(event.data).event === 'mask') {
            console.log('Маска успешно изменена')

        }
    });
}

/* Создание Input для загрузки изображения + Загрузка Drag&Drop + POST запрос для загрузки на сервер */
function updateFilesInfo(files) {

    if (files[0].type !== "image/png" && files[0].type !== "image/jpeg") {
        error.style.display = '';
        return
    }

    setTimeout(function () {
        error.style.display = 'none'
    }, 5000);
    sendFile(files[0])
}

function sendFile(file) {

    const formData = new FormData();
    formData.append('title', file.name);
    formData.append('image', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', 'https://neto-api.herokuapp.com/pic', true);



    xhr.addEventListener('loadstart', (event) => {
        error.style.display = 'none';
        imageLoader.style.display = 'block';
    })
    xhr.addEventListener('loadend', () => {
        if (xhr.status !== 200) error.style.display = '';
        imageLoader.style.display = 'none';
    })

    xhr.addEventListener('load', (event) => {
        if (xhr.status === 200) {

            let newCurrentImage = JSON.parse(xhr.responseText);
            loadInformFromId(newCurrentImage.id)
        } else console.log('error')
    })


    xhr.send(formData);

}

function createNewInput() {
    const newInput = document.createElement('input');
    newInput.setAttribute('type', 'file');
    newInput.setAttribute('accept', 'image/jpeg, image/png');
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
        error.style.display = ''
        setTimeout(function () {
            error.style.display = 'none'
        }, 5000);
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
        loadInformFromId(id[1]);
    } else if (sessionStorage.id) {
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

})

/* Перетаскивание меню */

menu.firstElementChild.addEventListener('mousedown', event => {
    dragMenu = event.currentTarget;
})

document.addEventListener('mousemove', event => {
    event.preventDefault();
    if (dragMenu) {
        let coord = {
            x: event.pageX,
            y: event.pageY
        }

        if (coord.x < (dragMenu.offsetWidth / 2)) {
            menu.style.setProperty('--menu-left', 0 + 'px')
            localStorage.x = 0;
        }
        if (coord.x > (dragMenu.offsetWidth / 2) && coord.x + menu.offsetWidth - (dragMenu.offsetWidth / 2) < document.documentElement.clientWidth) {
            menu.style.setProperty('--menu-left', `${coord.x - (dragMenu.offsetWidth / 2)}px`)
            localStorage.x = coord.x - (dragMenu.offsetWidth / 2);
        }
        if (coord.y < (dragMenu.offsetHeight / 2)) {
            menu.style.setProperty('--menu-top', 0 + 'px')
            localStorage.y = 0;
        }
        if (coord.y > (dragMenu.offsetHeight / 2) && coord.y + menu.offsetHeight - (dragMenu.offsetHeight / 2) < document.documentElement.clientHeight) {
            menu.style.setProperty('--menu-top', `${coord.y - (dragMenu.offsetHeight / 2)}px`)
            localStorage.y = coord.y - (dragMenu.offsetHeight / 2);
        }
    }
})

menu.firstElementChild.addEventListener('mouseup', event => {
    dragMenu = null;
})