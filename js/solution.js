'use strict'
const wrap = document.querySelector('.wrap.app'),
    menu = wrap.querySelector('.menu'),
    currentImage = wrap.querySelector('.current-image'),
    error = wrap.querySelector('.error'),
    imageLoader = wrap.querySelector('.image-loader');


let dragMenu = null; // Переменная для перетаскивания меню




/* Создание Input для загрузки изображения */
/* ------------------Реализовать загрузку на сервер--------------- */
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

    function updateFilesInfo(files) {

        if (files[0].type !== "image/png" && files[0].type !== "image/jpeg") {
            error.style.display = '';
            return
        }
        error.style.display = 'none';
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
                sessionStorage.src = newCurrentImage.url;
                requestLastImage()

            } else console.log('error')
        })


        xhr.send(formData);

    }

    document.querySelector('.menu__item.mode.new').appendChild(newInput);
}
document.addEventListener('DOMContentLoaded', createNewInput)



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

/* Проверка наличия ранее загруженного изображения */
function requestLastImage() {

    if (sessionStorage.src) {
        currentImage.src = sessionStorage.src
        currentImage.style.width = '70%'
        reloadStatus('default')
    } else {
        reloadStatus('initial')
    }
}

document.addEventListener('DOMContentLoaded', requestLastImage)

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
        modeShare = menu.querySelector('.share');

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








































































// document.addEventListener('DOMContentLoaded', function () {

//     const wrap = document.querySelector('.wrap.app'),
//         menu = wrap.querySelector('.menu'),
//         currentImage = wrap.querySelector('.current-image'),
//         error = wrap.querySelector('.error'),
//         imageLoader = wrap.querySelector('.image-loader'),
//         commentsForm = wrap.querySelector('.comments__form');






//     /* Menu */
//     /* -------------------------------------------------------------------------------------- */
//     function loadMenu(image) {
//         if (!image) {
//             menu.dataset.state = 'initial';
//             document.querySelector('.menu__item.burger').style.display = 'none';
//         } else {
//             menu.dataset.state = 'default';
//             document.querySelector('.menu__item.burger').style.display = '';
//         }

//     }
//     loadMenu(currentImage)


//     menu.addEventListener('click', event => clickMenu(menu))

//     function clickMenu(cont) {

//         const commentStat = cont.querySelector('.menu__item.tool.comments-tools');
//         const itemMenu = cont.querySelectorAll('li[data-state]');
//         const burger = cont.querySelector('.menu__item.burger');

//         function select(event) {
//             itemMenu.forEach(elem => elem.dataset.state = '')
//             event.currentTarget.dataset.state = 'selected';
//             menu.dataset.state = 'selected';
//         }

//         function burgerOpen(event) {
//             itemMenu.forEach(elem => elem.dataset.state = '')
//             menu.dataset.state = 'default';
//         }

//         function commentOff(event) {
//             if (cont.querySelector('#comments-off').checked) {
//                 document.querySelector('.comments__form').classList.add('hidden')
//             } else document.querySelector('.comments__form').classList.remove('hidden')
//         }


//         itemMenu.forEach(element => element.addEventListener('click', select));
//         burger.addEventListener('click', burgerOpen);
//         commentStat.addEventListener('click', commentOff);
//     }

//     // Drag&Drop Menu

//     const drag = wrap.querySelector('.menu__item.drag');

//     let movedPiece = null;
//     document.addEventListener('mousedown', event => {
//         if (event.target === drag) {
//             movedPiece = menu;
//         }
//     });

//     document.addEventListener('mousemove', event => {
//         if (movedPiece) {

//             event.preventDefault();

//             if (event.pageX + movedPiece.offsetWidth - (drag.offsetWidth / 2) < document.documentElement.clientWidth && event.pageX - (drag.offsetWidth / 2) > 0) {
//                 movedPiece.style.left = `${event.pageX - (drag.offsetWidth / 2)}px`;
//                 localStorage.positionMenuLeft = movedPiece.style.left;

//             }
//             if (event.pageY + movedPiece.offsetHeight - (drag.offsetHeight / 2) < document.documentElement.clientHeight && event.pageY - (drag.offsetWidth / 2) > 0) {
//                 movedPiece.style.top = `${event.pageY - (drag.offsetHeight / 2)}px`;
//                 localStorage.positionMenuTop = movedPiece.style.left;
//             }
//         }
//     });

//     document.addEventListener('mouseup', event => {
//         if (movedPiece) {
//             movedPiece = null;
//         }
//     });

//     /* -------------------------------------------------------------------------------------- */



//     /* ------------------------Download image--------------------------------------------- */
//     // input
//     const newInput = document.createElement('input');
//     newInput.setAttribute('type', 'file');
//     newInput.setAttribute('accept', 'image/jpeg, image/png');
//     newInput.setAttribute('class', 'downloadFile');
//     newInput.style.position = 'absolute';
//     newInput.style.display = 'block';
//     newInput.style.top = '0px';
//     newInput.style.left = '0px';
//     newInput.style.height = `${document.querySelector('.menu__item.mode.new').offsetHeight}px`;
//     newInput.style.width = `${document.querySelector('.menu__item.mode.new').offsetWidth}px`;
//     newInput.style.opacity = '0';
//     document.querySelector('.menu__item.mode.new').appendChild(newInput);

//     document.querySelector('.downloadFile')
//         .addEventListener('change', onSelectFiles);


//     function onSelectFiles(event) {
//         const files = Array.from(event.currentTarget.files);
//         updateFilesInfo(files);
//     }

//     function updateFilesInfo(files) {

//         if (files[0].type !== "image/png" && files[0].type !== "image/jpeg") {
//             error.style.display = '';
//             return
//         }
//         error.style.display = 'none';
//         sendFile(files[0])
//     }

//     function sendFile(file) {

//         const formData = new FormData();
//         formData.append('title', file.name);
//         formData.append('image', file);

//         const xhr = new XMLHttpRequest();
//         xhr.open('POST', 'https://neto-api.herokuapp.com/pic', true);



//         xhr.addEventListener('loadstart', (event) => {
//             error.style.display = 'none';
//             imageLoader.style.display = 'block';
//         })
//         xhr.addEventListener('loadend', () => {
//             if (xhr.status !== 200) error.style.display = '';
//             imageLoader.style.display = 'none';
//         })

//         xhr.addEventListener('load', (event) => {
//             if (xhr.status === 200) {

//                 let newCurrentImage = JSON.parse(xhr.responseText);
//                 const img = document.createElement('img');
//                 img.setAttribute('src', newCurrentImage.url);
//                 img.classList.add('current-image');
//                 img.style.width = "70%"
//                 wrap.insertBefore(img, error);
//                 localStorage.lastLoadImageId = newCurrentImage.id;
//                 localStorage.lastLoadImageUrl = newCurrentImage.url;

//                 loadMenu(img)

//             } else console.log('error')


//         })


//         xhr.send(formData);

//     }


















































// })


// function checkStory(local) {
//     if (local.lastLoadImageId) {
//         console.log('появилось изображение')
//         /* Перевести меню в режим рецензирования */
//         /* Создать Get запрос, получить информацию об изображении и загрузить его в тег img */
//     }
//     if (local.positionMenuLeft) {
//         console.log('появились координаты')
//         /* Выровнять меню согласно ранее полученных координат */
//     }
// }


// document.addEventListener('DOMContentLoaded', checkStory(localStorage))