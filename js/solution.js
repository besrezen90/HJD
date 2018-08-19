'use strict'

document.addEventListener('DOMContentLoaded', function () {

    const wrap = document.querySelector('.wrap.app'),
        menu = wrap.querySelector('.menu'),
        currentImage = wrap.querySelector('.current-image'),
        error = wrap.querySelector('.error'),
        imageLoader = wrap.querySelector('.image-loader'),
        commentsForm = wrap.querySelector('.comments__form');

    /* Menu */
    /* -------------------------------------------------------------------------------------- */

    if (!currentImage) {
        menu.dataset.state = 'initial';
        document.querySelector('.menu__item.burger').style.display = 'none';
    } else {
        menu.dataset.state = 'default';
    }

    menu.addEventListener('click', event => clickMenu(menu))

    function clickMenu(cont) {

        const commentStat = cont.querySelector('.menu__item.tool.comments-tools');
        const itemMenu = cont.querySelectorAll('li[data-state]');
        const burger = cont.querySelector('.menu__item.burger');

        function select(event) {
            itemMenu.forEach(elem => elem.dataset.state = '')
            event.currentTarget.dataset.state = 'selected';
            menu.dataset.state = 'selected';
        }

        function burgerOpen(event) {
            itemMenu.forEach(elem => elem.dataset.state = '')
            menu.dataset.state = 'default';
        }

        function commentOff(event) {
            if (cont.querySelector('#comments-off').checked) {
                document.querySelector('.comments__form').classList.add('hidden')
            } else document.querySelector('.comments__form').classList.remove('hidden')
        }


        itemMenu.forEach(element => element.addEventListener('click', select));
        burger.addEventListener('click', burgerOpen);
        commentStat.addEventListener('click', commentOff);
    }

    // Drag&Drop

    const drag = wrap.querySelector('.menu__item.drag');

    let movedPiece = null;
    document.addEventListener('mousedown', event => {
        if (event.target === drag) {
            movedPiece = menu;
        }
    });

    document.addEventListener('mousemove', event => {
        if (movedPiece) {

            event.preventDefault();

            if (event.pageX + movedPiece.offsetWidth - (drag.offsetWidth / 2) < document.documentElement.clientWidth && event.pageX - (drag.offsetWidth / 2) > 0) {
                movedPiece.style.left = `${event.pageX - (drag.offsetWidth / 2)}px`;

            }
            if (event.pageY + movedPiece.offsetHeight - (drag.offsetHeight / 2) < document.documentElement.clientHeight && event.pageY - (drag.offsetWidth / 2) > 0) {
                movedPiece.style.top = `${event.pageY - (drag.offsetHeight / 2)}px`;
            }
        }
    });

    document.addEventListener('mouseup', event => {
        if (movedPiece) {
            movedPiece = null;
        }
    });

    /* -------------------------------------------------------------------------------------- */



    /* ------------------------Download image--------------------------------------------- */
    // input
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
    document.querySelector('.menu__item.mode.new').appendChild(newInput);

    document.querySelector('.downloadFile')
        .addEventListener('change', onSelectFiles);


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
            imageLoader.style.display = 'block';
        })
        xhr.addEventListener('loadend', () => {
            imageLoader.style.display = 'none';
        })


        xhr.send(formData);
      

    }

















































})