const { app, BrowserWindow, ipcMain, Menu, MenuItem, dialog } = require('electron')
const fs = require('fs')

function askForMap() {
	win.webContents.send('main_channel', 'give_me_map!');	
}

function open() {
	dialog.showOpenDialog({
		title: 'Открытие',
		properties: ['openFile'],
		filters: [{name: "Альбом", extensions:["utya"] }],
		defaultPath: 'Новый альбом'
	}, (filePaths) => {
		if (filePaths) {
			let data = fs.readFileSync(filePaths[0]);
			data = JSON.parse(data);
			win.webContents.send('open_map', data)
		}
	})
}

const template = [
    {
    	label: 'Файл',
    	submenu: [
    	{
    		label: 'Открыть',
    		click() { open() }
    	},
    	{
    		label: 'Сохранить',
    		click() { askForMap() }
    	}
    	]
    },
	{
	  label: 'View',
	  submenu: [
	     {
	        role: 'reload'
	     },
	     {
	        role: 'toggledevtools'
	     },
	     {
	        type: 'separator'
	     },
	     {
	        role: 'togglefullscreen'
	     }
	  ]
	},

	{
	  role: 'window',
	  submenu: [
	     {
	        role: 'minimize'
	     },
	     {
	        role: 'close'
	     }
	  ]
	}
]

const menu = Menu.buildFromTemplate(template)
Menu.setApplicationMenu(menu)

function createWindow () {
	win = new BrowserWindow(maximizable = true)

	win.loadFile("index.html")
}

function sendDebugData(varname, data) {
	win.webContents.send('debug', {
		data: data,
		varname: varname
	});
}

app.on('ready', () => {
	const menu = Menu.buildFromTemplate(template)
	Menu.setApplicationMenu(menu)

	createWindow()
	
	ipcMain.on('main_channel', (event, message) => {
		const data = JSON.stringify(message);
			dialog.showSaveDialog({title: 'Сохранение',
									defaultPath: 'Новый альбом',
									filters: [{name: "Альбом", extensions:["utya"] }]},
									(filename) => {
										if (filename) {fs.writeFileSync(filename, data)} 
									});

	})
})