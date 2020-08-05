const { app, BrowserWindow, ipcMain, Menu, MenuItem, dialog } = require('electron')
const fs = require('fs')

let map;
let closing;
let path = '';;
let change_locking_areas_mode = true;

function open() {
    if ( Object.keys(map[1]).length !== 0 || ( map[0] !== '' && map[0] !== '<br>' ) ) {
        if (path === '') {
            dialog.showMessageBox({
                title: 'Открытие',
                type: 'warning',
                message: 'Сохранить альбом перед закрытием?',
                buttons: ['Сохранить', 'Не сохранять', 'Отмена'],
                defaulId: 0,
                cancelId: 2
            }, (response) => {
                if (response === 0) {
                    win.webContents.send('save_as', 'give_me_map!')
                    sub_open()
                } else if (response === 1) {
                    sub_open()
                }
            })

        } else {
            win.webContents.send('save', 'give_me_map!')
            sub_open()
        }
    } else {
        sub_open()
    }
}

function sub_open() {
    dialog.showOpenDialog({
        title: 'Открытие',
        properties: ['openFile'],
        filters: [{name: "Альбом", extensions:["utya"] }],
        defaultPath: 'Новый альбом'
        }, (filePaths) => {
            if (filePaths) {
                if (template[1]['submenu'][0].label == 'Переключить в режим просмотра') {
                    template[1]['submenu'][0].label = 'Переключить в режим редактирования';
                    win.webContents.send('change_view', 'view')
                }
                template[3].label = 'Страница: 1'

                const menu = Menu.buildFromTemplate(template)
                Menu.setApplicationMenu(menu)

                path = filePaths[0];
                let data = fs.readFileSync(filePaths[0]);
                map = JSON.parse(data);
                win.webContents.send('open_map', map)
        }
    })
}

function save() {
    if (path) {
        const data = JSON.stringify(map);
        fs.writeFileSync(path, data)
    }
}

function save_as() {
    const data = JSON.stringify(map);
    dialog.showSaveDialog({
        title: 'Сохранение',
        defaultPath: 'Новый альбом',
        filters: [{name: "Альбом", extensions:["utya"] }]
        }, (filename) => {
            if (filename) {
                path = filename;
                fs.writeFileSync(filename, data)
            }
        }
    )
}

function change_view() {
    if (template[1]['submenu'][0].label == 'Переключить в режим редактирования') {
        template[1]['submenu'][0].label = 'Переключить в режим просмотра';
        win.webContents.send('change_view', 'edit')
    } else if (template[1]['submenu'][0].label == 'Переключить в режим просмотра') {
        template[1]['submenu'][0].label = 'Переключить в режим редактирования';
        win.webContents.send('change_view', 'view')
        template[3].label = 'Страница: 1'
    }

    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)
}

function chooseImage(event) {
    let image_path

    dialog.showOpenDialog({
        title: 'Выберите изображение'
    }, (filename) => {
        if (filename) {
            image_path = filename[0]
            event.returnValue = image_path;
        } else {
            event.returnValue = ''
        }
    })
}

function sendDebugData(varname, data) {
    win.webContents.send('debug', {
        data: data,
        varname: varname
    });
}

function newAlbum () {
    if (template[1]['submenu'][0].label == 'Переключить в режим редактирования') {
        template[1]['submenu'][0].label = 'Переключить в режим просмотра';
        win.webContents.send('change_view', 'edit')
    }

    template[3].label = 'Страница: 1'

    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)

    if (path === '') {
        dialog.showMessageBox({
            title: 'Новый альбом',
            type: 'warning',
            message: 'Сохранить альбом перед закрытием?',
            buttons: ['Сохранить', 'Не сохранять', 'Отмена'],
            defaulId: 0,
            cancelId: 2
        }, (response) => {
            if (response === 0) {
                win.webContents.send('save_as', 'give_me_map!')
                map = {}
                path = ''
                win.webContents.send('new_album', 'open_new_album!!!')
            } else if (response === 1) {
                map = {}
                path = ''
                win.webContents.send('new_album', 'open_new_album!!!')
            }
        })

    } else {
        win.webContents.send('save', 'give_me_map!')
        map = {}
        path = ''
        win.webContents.send('new_album', 'open_new_album!!!')
    }
}

function close(event) {
    if ( !closing ) {
        event.preventDefault()
        
        dialog.showMessageBox({
            title: 'Закрытие',
            type: 'warning',
            message: 'Сохранить альбом перед закрытием?',
            buttons: ['Сохранить', 'Не сохранять', 'Отмена'],
            defaulId: 0,
            cancelId: 2
        }, (response) => {
            if (response === 0) {
                if ( path ) {
                    win.webContents.send('save_and_quit', 'give_me_map!')
                } else {
                    win.webContents.send('save_as_and_quit', 'give_me_map!')
                }
                closing = true
            } else if (response === 1) {
                closing = true
                app.quit()
            }
        })
    }
}

function change_locking_areas() {
    change_locking_areas_mode = !change_locking_areas_mode 
    win.webContents.send('change_locking_areas', change_locking_areas_mode.toString() )
}

let template = [
    {
        label: 'Файл',
        submenu: [
        {
            label: 'Новый альбом',
            accelerator: 'CmdOrCtrl+N',
            click() { newAlbum() }
        },
        {
            label: 'Открыть',
            accelerator: 'CmdOrCtrl+O',
            click() { win.webContents.send('open', 'give_me_map!') }
        },
        {
            label: 'Сохранить',
            accelerator: 'CmdOrCtrl+S',
            click() {
                if (path) {
                    win.webContents.send('save', 'give_me_map!')
                } else {
                    win.webContents.send('save_as', 'give_me_map!')
                }
            }
        },
        {
            label: 'Сохранить как...',
            accelerator: 'CmdOrCtrl+Shift+S',
            click() { win.webContents.send('save_as', 'give_me_map!') }
        },
        {
            label: 'Печать страницы',
            accelerator: 'CmdOrCtrl+P',
            click() {
                if (template[1]['submenu'][0].label == 'Переключить в режим просмотра') {
                    template[1]['submenu'][0].label = 'Переключить в режим редактирования';

                    const menu = Menu.buildFromTemplate(template)
                    Menu.setApplicationMenu(menu)
                }
                win.webContents.send('print', 'print!')
            }
        },
        {
            label: 'Печать альбома',
            accelerator: 'CmdOrCtrl+Shift+P',
            click() {
                if (template[1]['submenu'][0].label == 'Переключить в режим просмотра') {
                    template[1]['submenu'][0].label = 'Переключить в режим редактирования';
                }
                template[3].label = `Страница: 1`

                const menu = Menu.buildFromTemplate(template)
                Menu.setApplicationMenu(menu)
                win.webContents.send('print_all', 'print!')
            }
        },
        {
            label: 'Выйти из приложения',
            click() { app.quit() }
        }
        ]
    },
    {
        label: 'Режим',
        submenu: [
        {
            label: 'Переключить в режим просмотра',
            click() { change_view() }
        },
        {
            label: 'Блокировка занятых областей',
            type: 'checkbox',
            checked: true,
            click() { change_locking_areas() }
        }
        ]
    },
    {
        type: 'separator'
    },
    {
        label: `Страница: 1`
    }
    /*,{
      label: 'Вид',
      submenu: [
         {
            role: 'reload'
         },
         {
            role: 'toggledevtools',
         }
      ]
    }
    */
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

let win;

app.on('ready', () => {
    const menu = Menu.buildFromTemplate(template)
    Menu.setApplicationMenu(menu)

    win = new BrowserWindow(maximizable = true)

    win.loadFile("index.html")

    win.webContents.on("did-finish-load", () => {
        if ( process.argv[1] !== undefined ) {
            if (process.argv[1].substr(-5) === '.utya') {
                if (template[1]['submenu'][0].label == 'Переключить в режим просмотра') {
                    template[1]['submenu'][0].label = 'Переключить в режим редактирования';
                    win.webContents.send('change_view', 'view')
                }
                template[3].label = 'Страница: 1'

                const menu = Menu.buildFromTemplate(template)
                Menu.setApplicationMenu(menu)

                path = process.argv[1]
                let data = fs.readFileSync(path)
                map = JSON.parse(data)
                win.webContents.send('open_map', map)
            }
        }
    })
    
    ipcMain.on('save_as', (event, message) => {
        map = message;
        save_as()
    })
    ipcMain.on('save', (event, message) => {
        map = message;
        save();
    })
    ipcMain.on('save_as_and_quit', (event, message) => {
        console.log('save_as_and_quit')
        map = message;
        save_as()
        closing = true
        app.quit()
    })
    ipcMain.on('save_and_quit', (event, message) => {
        console.log('save_and_quit')
        map = message;
        save();
        closing = true
        app.quit()
    })

    ipcMain.on('choose image', (event, message) => {
        chooseImage(event);
    })
    ipcMain.on('change_page', (event, message) => {
        template[3].label = `Страница: ${message + 1}`

        const menu = Menu.buildFromTemplate(template)
        Menu.setApplicationMenu(menu)
    })
    ipcMain.on('take_map_and_open', (event, message) => {
        map = message
        open()
    })
    
    win.on('close', (event) => {
        close(event)
    })
})