const fs = require('fs')
const { ipcRenderer } = require('electron')

const areas = {
    0: [0, 1, 3, 4],
    1: [0, 1, 2, 3, 4, 5],
    2: [1, 2, 4, 5],
    3: [0, 1, 3, 4, 6, 7],
    4: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    5: [1, 2, 4, 5, 7, 8],
    6: [3, 4, 6, 7],
    7: [3, 4, 5, 6, 7, 8],
    8: [4, 5, 7, 8]
}

let PRINT_MAP = ''
let map = {}; map[0] = ''; map[1] = {};
let page = 0;
let view_mode = 'edit';
let myNicEditor = null;
let dragingSheet = '';
let dragingDiv;
let dragingDivAreaNumber;
let locking_areas_mode = true;

function getBlobFromBase64(base64) {
    const binaryText = Buffer.from(base64, 'base64').toString('binary')

    const codes = []
    for (let i = 0; i < binaryText.length; i++) {
        codes.push(binaryText.charCodeAt(i))
    }

    const byteArray = new Uint8Array(codes)
    return new Blob([byteArray])
}

function cleanPageFromTextsAndSubtexts() {
    myNicEditor.removeInstance('title')
    myNicEditor.removeInstance('front_page_text')

    for (let element in map[page]) {
        if (map[page][element][0] === 'text') {
            myNicEditor.removeInstance(map[page][element][2].toString())
        } else if (map[page][element][0] === 'img' && map[page][element][2] !== undefined) {
            myNicEditor.removeInstance( element.toString() )
        }
    }
}

function swipe_left() {
    if (page > 0) {
        cleanPageFromTextsAndSubtexts()
        page -= 1;
        drawPage()

        ipcRenderer.send('change_page', page)
    }
}

function swipe_right() {
    if ( Object.keys( map[page] ).length !== 0 || page === 0) {
        if ( (map[page + 1] === undefined || Object.keys( map[page + 1] ).length === 0) && view_mode === 'view') {
            return
        }
        if ( map[page + 1] === undefined ) {
            map[page + 1] = {}
        }

        cleanPageFromTextsAndSubtexts()
        page += 1
        drawPage()

        ipcRenderer.send('change_page', page)
    }
}

function makeBottomBlueZoneForImage(number_of_area, arg, div) {
    let sub_div = document.createElement('div')
    sub_div.style = 'width: 90%; height: 15%; bottom: 0px; position: absolute'

    if (arg === 'new') {
        sub_div.style.cursor = 'pointer'
        sub_div.onmouseover = () => {
            sub_div.className = 'just-blue-border'
        }
        sub_div.onmouseout = () => {
            sub_div.className = ''   
        }
        sub_div.onclick = (e) => {
            e.stopPropagation()
            
            sub_div.id = `img${number_of_area}`
            map[page][number_of_area][2] = ''

            sub_div.className ='sub-text'
                    
            sub_div.onmouseover = () => {}
            sub_div.onmouseout = () => {}
            sub_div.onclick = (e) => { e.stopPropagation() }

            drawPage()
        }
    } else if (arg === 'old') {
        sub_div.id = `img${number_of_area}`
        sub_div.innerHTML = map[page][number_of_area][2]

        sub_div.className ='sub-text'   
                
        sub_div.onclick = (e) => { e.stopPropagation() }
        sub_div.onkeypress = () => {
            setTimeout(() => map[page][number_of_area][2] = sub_div.innerHTML)
        }
        sub_div.onblur = () => {
            setTimeout(() => map[page][number_of_area][2] = sub_div.innerHTML)
        }
        
        if (view_mode === 'edit') {
            let sub_del_div = document.createElement('div')
            sub_del_div.className = 'del-div-for-imageText'

            sub_del_div.onclick = (e) => {
                e.stopPropagation()

                delete map[page][number_of_area][2]
                drawPage()
            }

            div.appendChild( sub_del_div )
        }
    }


    return sub_div
}

function changeStr(str, a, number_of_area) {
    str = parseInt( str.slice(0, -1) )
    if (str + a > 0 && str + a <= 100) {str += a}
    str = str.toString() + '%'

    return str

}

function makePlusMinusPanel(div, number_of_area) {
    let plusMinusPanel = document.createElement('div')
    plusMinusPanel.className = 'plus-minus-panel'

    let plus_div = document.createElement('div')
    let minus_div = document.createElement('div')

    plusMinusPanel.appendChild(plus_div)
    plusMinusPanel.appendChild(minus_div)

    plus_div.className = 'plus-div'
    minus_div.className = 'minus-div'

    plus_div.onclick = () => {
        if (map[page][number_of_area].size !== undefined) {
            map[page][number_of_area].size = Math.min((map[page][number_of_area].size|0)+10, 100)
        } else {
            map[page][number_of_area].size = 100
        }

        drawPage()
    }

    minus_div.onclick = () => {
        if (map[page][number_of_area].size !== undefined) {
            map[page][number_of_area].size = Math.max((map[page][number_of_area].size|0)-10, 20)
        } else {
            map[page][number_of_area].size = 90
        }

        drawPage()
    }


    plusMinusPanel.onclick = (e) => {
        e.stopPropagation()
    }

    return plusMinusPanel
}

function lightOn(number_of_area, args, printArg, printPromises) {
    let main_div = document.createElement('div')
    let div = document.createElement('div')
    main_div.appendChild(div)
    div.style = `width: ${map[page][number_of_area] !== undefined && map[page][number_of_area].size !== undefined ? map[page][number_of_area].size : 100}%;
                 height: ${map[page][number_of_area] !== undefined && map[page][number_of_area].size !== undefined ? map[page][number_of_area].size : 100}%`

    if      (number_of_area == 0) { main_div.style = 'width: 50%; height: 50%; left: 0%; top: 0%' }
    else if (number_of_area == 1) { main_div.style = 'width: 100%; height: 50%; top: 0%' }
    else if (number_of_area == 2) { main_div.style = 'width: 50%; height: 50%; right: 0px; top: 0%'; }
    else if (number_of_area == 3) { main_div.style = 'width: 50%; height: 100%; left: 0%'; }
    else if (number_of_area == 4) { main_div.style = 'width: 100%; height: 100%'; }
    else if (number_of_area == 5) { main_div.style = 'width: 50%; height: 100%; right: 0px'; }
    else if (number_of_area == 6) { main_div.style = 'width: 50%; height: 50%; bottom: 0px; left: 0%'; }
    else if (number_of_area == 7) { main_div.style = 'width: 100%; height: 50%; bottom: 0px'; }
    else if (number_of_area == 8) { main_div.style = 'width: 50%; height: 50%; bottom: 0px; right: 0px'; }

    if      (args[0] === 'class')   { main_div.className = "just-blue-border" }
    else if (args[0] === 'text') {
        div.className = 'text-div'

        let text_sub_div = document.createElement('div')
        text_sub_div.className = 'text'
        text_sub_div.id = number_of_area
        text_sub_div.innerHTML = args[1]
        div.appendChild( text_sub_div )
        text_sub_div.onkeypress = () => {
            setTimeout(() => { 
                if ( map[page][number_of_area] ) { 
                    map[page][number_of_area][1] = text_sub_div.innerHTML
                } 
            })
        }
        text_sub_div.onblur = () => {
            setTimeout(() => { 
                if ( map[page][number_of_area] ) { 
                    map[page][number_of_area][1] = text_sub_div.innerHTML
                } 
            })
        }

        if (view_mode === 'edit') {
            let sub_div_shit = document.createElement('div')
            sub_div_shit.className = 'draging-shit'
            sub_div_shit.draggable = true

            div.appendChild( sub_div_shit )
        }

        if (view_mode === 'edit') {
            main_div.appendChild( makePlusMinusPanel(div, number_of_area) )
        }

    }
    else if (args[0] === 'img') {
        let img = document.createElement('img')

        if (printArg !== undefined) {
            printPromises.push(new Promise( (ok) => { img.onload = () => { ok() } }))
        }

        if (args[1] === 'empty') {
            const image_url = 'add_photo_img2.png'
            img.src = image_url
        } else {
            const image_url = getBlobFromBase64( args[1] )
            img.src = `${ URL.createObjectURL(image_url) }`
        }
        
        img.style.height = `${ args[2] === undefined ? '100%' : '85%' }`
        img.className = 'image unselectable'
        img.setAttribute('data-draggable', 'true')
        div.appendChild( img )

        div.onclick = () => {
            const path = ipcRenderer.sendSync('choose image', '')
            if (path !== '') {
                const img_base64 = fs.readFileSync(path).toString('base64')

                map[page][number_of_area][1] = img_base64

                drawPage()
            }
        }
        div.addEventListener('drop', (e) => {
            const path = e.dataTransfer.files[0].path
            const img_base64 = fs.readFileSync(path).toString('base64')

            map[page][number_of_area][1] = img_base64

            drawPage()
        })
        if (args[2] === undefined) {
            main_div.appendChild( makeBottomBlueZoneForImage(number_of_area, 'new', div) )
        } else {
            main_div.appendChild( makeBottomBlueZoneForImage(number_of_area, 'old', div) )
        }

        if (view_mode === 'edit') {
            main_div.appendChild( makePlusMinusPanel(div, number_of_area) )
        }
    }

    if (args[0] === 'img' || args[0] === 'text') {
        main_div.className = 'main-div unselectable'

        main_div.addEventListener('dragstart', () => {
            dragingSheet = main_div
            dragingDiv = map[page][number_of_area]
            dragingDivAreaNumber = number_of_area
            delete map[page][number_of_area]

            main_div.style.opacity = '0.3'
        })
        main_div.addEventListener('dragend', () => {
            dragingSheet = ''
            dragingDivAreaNumber = undefined
            drawPage()
            document.getElementById('areas').style.display = 'none'
        })
    }

    main_div.style.position = 'absolute'

    return main_div
}

function checkDraggable(e) {
    let types = e.dataTransfer.types
    
    let containsFiles = false

    for (let i = 0; i < types.length; i++) {
        if (types[i] === "Files") { containsFiles = true; break }  
    }

    return dragingSheet != '' || containsFiles 
}

function makeMainLabel() {
    let div = document.createElement('div')
    div.innerHTML = 'Фотоальбом'

    div.className = 'front-page-label unselectable'

    return div
}

function makeTextInputForFrontPage() {
    let div = document.createElement('div')

    div.className = 'front_page_text_div'

    let text_sub_div = document.createElement('div')
    text_sub_div.className = 'text'
    text_sub_div.id = 'front_page_text'
    text_sub_div.innerHTML = map[0]
    div.appendChild( text_sub_div )
    text_sub_div.onkeypress = () => {
        setTimeout(() => { map[0] = text_sub_div.innerHTML })
    }
    text_sub_div.onblur = () => {
        setTimeout(() => { map[0] = text_sub_div.innerHTML })
    }

    return div
}

function makeTitleForPage(arg) {
    let div = document.createElement('div')
    div.className = 'title-div'

    if (view_mode === 'edit') {
        div.style.top = '26px'
    } else {
        div.style.top = '0px'
    }

    let sub_div = document.createElement('div')
    div.appendChild(sub_div)

    if (arg === 'new') {
        sub_div.style = 'min-width: 100%; z-index: 2; height: 100%;'

        sub_draw_frame.style.height = '100%'

        sub_div.style.cursor = 'pointer'
        sub_div.onmouseover = () => {
            sub_div.className = 'just-blue-border'
        }
        sub_div.onmouseout = () => {
            sub_div.className = ''   
        }
        sub_div.onclick = (e) => {
            e.stopPropagation()
            
            sub_div.id = `title`
            map[page].title = ''

            sub_div.className ='title-text'
            sub_draw_frame.style.height = 'calc(100% - 66px)'
                    
            sub_div.onmouseover = () => {}
            sub_div.onmouseout = () => {}
            sub_div.onclick = (e) => { e.stopPropagation() }

            drawPage()
        }
    } else if (arg === 'old') {
        sub_div.style = 'min-width: 20%; z-index: 2; height: 100%;'

        sub_draw_frame.style.height = 'calc(100% - 66px)'

        sub_div.id = `title`
        sub_div.innerHTML = map[page].title

        sub_div.className ='title-text'

        sub_div.onclick = (e) => { e.stopPropagation() }
        sub_div.onkeypress = () => {
            setTimeout(() => {map[page].title = sub_div.innerHTML})
        }
        sub_div.onblur = () => {
            setTimeout(() => {map[page].title = sub_div.innerHTML})
        }
    }

    if (view_mode === 'edit') {
        let sub_div_shit = document.createElement('div')
        sub_div_shit.className = 'del-title-button-div'

        let sub_sub_shit = document.createElement('div')
        sub_sub_shit.className = 'del-title-button'
        sub_div_shit.appendChild ( sub_sub_shit )

        sub_sub_shit.onclick = (e) => {
            e.stopPropagation()

            delete map[page].title
            drawPage()
        }

        div.appendChild( sub_div_shit )
    }

    return div
}

function makeTitlePageTextEditor() {
    let div = document.createElement('div')

    div.id = 'editor'

    div.className = 'title-for-front-page'

    return div
}

function makeNormalPageEditor() {
    let div = document.createElement('div')

    div.id = 'editor'

    div.className = 'editor-for-normal-page'

    return div
}


function resetPage() {
    draw_frame.innerHTML = `<div class="sub_draw_frame" id="sub_draw_frame"></div>`
}

function drawPage(arg) {
    resetPage() 
    let promises = []
    
    if (page === 0) {                                                    //front page
        if (draw_frame.children.length > 1) {
            draw_frame.removeChild( draw_frame.children[1] )
        }

        image_frame.style = 'background-color: #BBBBBB;'

        sub_draw_frame.appendChild( makeMainLabel() )
        sub_draw_frame.appendChild( makeTextInputForFrontPage() )

        if (view_mode === 'edit') {
            sub_draw_frame.appendChild( makeTitlePageTextEditor() )
            myNicEditor.setPanel('editor')
        }
        
        myNicEditor.addInstance('front_page_text')

        document.getElementById('tools-area').style.display = 'none'
        document.getElementById('areas').style.display = 'none'

    } else {                                                                    //normal page
        if (view_mode === 'edit') {
            document.getElementById('tools-area').style.display = ''
        }

        if (draw_frame.children.length > 1) {
            draw_frame.removeChild( draw_frame.children[1] )
        }

        if (map[page].title === undefined) {
            draw_frame.appendChild( makeTitleForPage('new') )
        } else {
            draw_frame.appendChild( makeTitleForPage('old') )
        }

        if (map[page].title !== undefined) { myNicEditor.addInstance('title') }


        image_frame.style = 'background-color: #E1E1E1;'

        for (let element in map[page]) {
            sub_draw_frame.appendChild( lightOn(element, map[page][element], arg, promises) )

            if (map[page][element][0] === 'text') {
                myNicEditor.addInstance(`${element}`)
            } else if (map[page][element][0] === 'img' && map[page][element][2] !== undefined) {
                myNicEditor.addInstance(`img${element}`)
            }
        }

        if (view_mode == 'edit') {
            draw_frame.appendChild( makeNormalPageEditor() )
            myNicEditor.setPanel('editor')
            if (map[page].title === undefined) {
                sub_draw_frame.style.height = 'calc(100% - 26px)'
            }
        }
    }

    if (view_mode === 'view') {
        if (page === 0) {
            front_page_text.setAttribute('contenteditable', 'false')
        } else {
            lockAndUnlockTextDivs('false')
        }
        if (map[page].title === undefined) {
            sub_draw_frame.style.height = '100%'
        } else {
            sub_draw_frame.style.height = 'calc(100% - 40px)'
        }
    } else {
        if (page === 0) {
            front_page_text.setAttribute('contenteditable', 'true')
        } else {
            lockAndUnlockTextDivs('true')
        }
    }

    return promises
}

function lockAndUnlockTextDivs(arg) {
    if (map[page].title !== undefined) {
        title.setAttribute('contenteditable', arg)
    }

    for (let element in map[page]) {
        if (map[page][element][0] === 'text') {
            document.getElementById(element.toString()).setAttribute('contenteditable', arg)  
        } else if (map[page][element][0] === 'img' && map[page][element][2] !== undefined) {
            document.getElementById(`img${element}`).setAttribute('contenteditable', arg)
        }
    }
}

function del(names) {
    names.forEach( (value) => {
        delete map[page][value]
    })
}

function is_clear(number_of_area) {
    let res = true;
    areas[number_of_area].forEach( (value) => {
        if ( map[page][value] ) { res = false }
    })

    return res
}

function addElementToMap(number_of_area, args) {
    if (locking_areas_mode === false) {
        del( areas[number_of_area] )
        
        map[page][ number_of_area ] = args
    } else if ( is_clear( number_of_area ) ) {
        map[page][ number_of_area ] = args
    }
}

function blurAll(next) {
    setTimeout(next)
}

function rewriteMap() {
    if (page === 0) {
        map[page] = document.getElementById('front_page_text').innerHTML
    } else {
        for (let key in map[page]) {
            if (key === 'title') {
                map[page].title = document.getElementById('title').innerHTML
            } else if (map[page][key][0] === 'text') {
                map[page][key][1] = document.getElementById(key).innerHTML
            } else if (map[page][key][0] === 'img' && map[page][key][2] !== undefined ) {
                map[page][key][2] = document.getElementById(`img${key}`).innerHTML
            }
        }
    }
}

function patchOldMap(old) {
    for (let i = 1; old[i] !== undefined; i++) {
        let p = old[i]
        for (let zone = 0; zone < 9; zone++) {
            if (p[zone] !== undefined) {
                let obj = {}
                for (let k in p[zone]) { obj[k] = p[zone][k] }
                p[zone] = obj
            }
        }
    } 
}

function addPagesToPrint() {
    page = 0
    drawPage()
    let start_page_inner = document.getElementById('page_div').innerHTML

    for (let i = 0; i < Object.keys(map).length; i++) {
        page = i
        drawPage()
        PRINT_MAP += `<div style="height: 100%; display: flex; justify-content: center;">${document.getElementById('page_div').innerHTML}</div>`
    }
    
    document.getElementById('page_div').innerHTML = PRINT_MAP

    let promises = []

    const img_elements = document.getElementsByTagName('img')
    
    for (let i = 0; i < img_elements.length; i++) {
        const e = img_elements[i]
        
        if (e.id == 'photo-sheet' || e.id == 'text-sheet') { continue }

        promises.push(new Promise( (ok) => { e.onload = () => { ok() } }))
    }

    document.getElementById('page_div').className = 'page_print'

    document.getElementById('tools-area').style.display = 'none'
    document.getElementById('mask').style.display = ''
    Promise.all(promises).then(() => { 
        print();
        document.getElementById('page_div').className = 'page'

        page = 0
        document.getElementById('page_div').innerHTML = start_page_inner
        initDropZones()
        PRINT_MAP = ''
    })
}

function initDropZones() {
    for (let i = 0; i < 9; i++) {
        const dropZone = document.getElementById(`area${i}`);
        dropZone.addEventListener('dragover', (e) => {
            if (!checkDraggable(e)) { return }

            e.preventDefault()
            e.dataTransfer.dropEffect = 'move'

            if (!locking_areas_mode || is_clear(i)) {
                if (sub_draw_frame.children.length === 0 || sub_draw_frame.children[ sub_draw_frame.children.length - 1 ].className !== 'just-blue-border') {
                    sub_draw_frame.appendChild( lightOn( i, ['class'] ) )
                }
            }
        });
        dropZone.addEventListener('dragleave', (e) => {

            if (sub_draw_frame.children.length !== 0 && sub_draw_frame.children[ sub_draw_frame.children.length - 1 ].className === 'just-blue-border') {
                sub_draw_frame.removeChild( sub_draw_frame.children[ sub_draw_frame.children.length - 1 ] )
            }
        });
        dropZone.addEventListener('drop', (e) => {
            document.getElementById('areas').style.display = 'none'
            document.getElementById('cont').style.display = ''

            sub_draw_frame.removeChild( sub_draw_frame.children[ sub_draw_frame.children.length - 1 ] )

            if (dragingSheet === 'photo-sheet') {
                addElementToMap(i, { 0: 'img', 1: 'empty' } )
            } else if (dragingSheet === 'text-sheet') {
                addElementToMap(i, {0: 'text', 1: '', 2: i } )
            } else if (dragingSheet.nodeName === 'DIV') { 
                if (locking_areas_mode && !is_clear(i)) {
                    map[page][dragingDivAreaNumber] = dragingDiv
                }
                addElementToMap(i, dragingDiv)
            } else if (dragingSheet === '') {                         //drop new image from outside
                const image_path = e.dataTransfer.files[0].path
                const img_base64 = fs.readFileSync(image_path).toString('base64')
                const sub_text = map[page][i] ? map[page][i][2] : undefined
                addElementToMap(i, { 0: 'img', 1: img_base64, 2: sub_text } )
            } else { console.log(dragingSheet) }

            drawPage()
        })
    }
}


DEBUG = { exceptions: [] }  
window.onload = () => {
    myNicEditor = new nicEditor({buttonList : ['bold','italic','underline', 'left', 'center', 'justify', 'indent', 'outdent',
                                                'fontSize', 'fontFamily'] })

    document.getElementById('left-btn').onmouseover = () => {
        document.getElementById('left-btn').className = 'btn-onmouseover'
    }
    document.getElementById('left-btn').onmouseout = () => {
        document.getElementById('left-btn').className = 'btn'
    }
    document.getElementById('right-btn').onmouseover = () => {
        document.getElementById('right-btn').className = 'btn-onmouseover'
    }
    document.getElementById('right-btn').onmouseout = () => {
        document.getElementById('right-btn').className = 'btn'
    }

    document.getElementById('photo-sheet').addEventListener('dragstart', () => {dragingSheet = 'photo-sheet'})
    document.getElementById('text-sheet' ).addEventListener('dragstart', () => {dragingSheet = 'text-sheet'})
    document.getElementById('sub-tools-area' ).addEventListener('dragstart', () => {
        document.getElementById('areas').style = ""
    })
    document.getElementById('sub-tools-area' ).addEventListener('dragend', () => {
        dragingSheet = ''
        document.getElementById('areas').style.display = 'none'
    })

    initDropZones()

    cont.addEventListener('dragover', () => {
        if (view_mode === 'edit' && page !== 0) {
            document.getElementById('areas').style.display = ''
        }
    })

    bin.addEventListener('dragover', (e) => {
        e.preventDefault()
    })

    ipcRenderer.on('save_as', (event, message) => {
        blurAll(() => { ipcRenderer.send('save_as', map) })
    })
    ipcRenderer.on('save_as_and_quit', (event, message) => {
        blurAll(() => { ipcRenderer.send('save_as_and_quit', map) })
    })

    ipcRenderer.on('debug', (event, message) => {
        DEBUG[message.varname] = message.data
    })
    ipcRenderer.on('open_map', (event, message) => {
        document.getElementById('areas').style.display = 'none'
        view_mode = 'view'
        page = 0

        map = message
        patchOldMap(map)

        drawPage()
    })
    ipcRenderer.on('save', (event, message) => {
        blurAll(() => {ipcRenderer.send('save', map)})
    })
    ipcRenderer.on('save_and_quit', (event, message) => {
        blurAll(() => {ipcRenderer.send('save_and_quit', map)})
    })
    ipcRenderer.on('change_view', (event, message) => {
        blurAll(() => {
            if (message === 'view') {
                view_mode = 'view'
                page = 0
                blurAll( () => {
                    drawPage()     
                    document.getElementById('tools-area').style.display = 'none'
                    document.getElementById('mask').style.display = ''
                })
            } else if (message === 'edit') {
                view_mode = 'edit'
                drawPage()
                if (page !== 0) {
                    document.getElementById('tools-area').style.display = ''
                }
                document.getElementById('mask').style.display = 'none'
            }
        })
    })
    ipcRenderer.on('new_album', (event, message) => {
        map = {}; map[0] = ''; map[1] = {};
        page = 0;
        view_mode = 'edit'
        drawPage()
    })
    ipcRenderer.on('print', (event, message) => {
        view_mode = 'view'
        Promise.all(drawPage('print')).then( () => {
            document.getElementById('tools-area').style.display = 'none'
            document.getElementById('mask').style.display = ''
            lockAndUnlockTextDivs('false')
            setTimeout(() => print(), 100)
        })
    })
    ipcRenderer.on('open', (event, message) => {
        ipcRenderer.send('take_map_and_open', map)
    })
    ipcRenderer.on('change_locking_areas', (event, message) => {
        locking_areas_mode = ( message == 'true' )
    })
    ipcRenderer.on('print_all', (event, message) => {
        view_mode = 'view'
        addPagesToPrint()
    })

    drawPage()

    setInterval( rewriteMap, 500 )
}