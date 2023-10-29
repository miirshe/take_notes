const http = require('http');
const fs = require('fs')
const path = require('path');
const url = require('url');
const formidable = require('formidable')

const replaceTemplete = (temp, res) => {
    let tempData = temp.replace(/{%id%}/g, res.id);
    tempData = tempData.replace(/{%title%}/g, res.title);
    tempData = tempData.replace(/{%description%}/g, res.description);
    return tempData;
}

const indexPage = fs.readFileSync(path.join(__dirname, 'view', 'index.html'), 'utf-8');
const updatePage = fs.readFileSync(path.join(__dirname, 'view', 'updatePage.html'), 'utf-8');
const myNotes = fs.readFileSync(path.join(__dirname, 'view', 'myNotes.html'), 'utf-8');
const updateMynotes = fs.readFileSync(path.join(__dirname, 'view', 'updateMynotes.html'), 'utf-8');
const noteDB = fs.readFileSync(path.join(__dirname, 'model', 'noteDB.json'), 'utf-8')
const dataDB = JSON.parse(noteDB);
const PORT = 8000;

const server = http.createServer((req, res) => {
    const { query, pathname } = url.parse(req.url, true);
    if (pathname == '/' && req.method == 'GET') {
        res.writeHead(200, { 'content-type': 'text/html' });
        const notes = dataDB.map(res => replaceTemplete(myNotes, res)).join('');
        const indexRoute = indexPage.replace("{%myNotes%}", notes)
        res.end(indexRoute)
    } else if (pathname === '/add' && req.method === 'POST') {


        const form = new formidable.IncomingForm();
        form.parse(req, (err, fields, files) => {
            if (err) {
                res.writeHead(500, { 'content-type': 'text/plain' });
                res.write(`<h1>${err.message}</h1>`);
                res.end();
            } else {
                if (fields == undefined) {
                    res.writeHead(500, { 'content-type': 'text/plain' });
                    res.write(`<h1>fields is empty h1>`);
                    res.end();
                } else {
                    const id = Math.floor(Math.random() * 1000) + 1;
                    const title = fields.title.toString();
                    const description = fields.description.toString();
                    dataDB.push({
                        id: id,
                        title: title,
                        description: description
                    })
                    console.log(dataDB)
                    fs.writeFile('./model/noteDB.json', JSON.stringify(dataDB, null, 2), (err) => {
                        if (err) {
                            res.writeHead(404, { 'content-type': 'text/plain' });
                            res.write(`<h1>${err.message}</h1>`);
                            res.end();
                        } else {
                            console.log('successfully added');
                            res.writeHead(302, { 'Location': '/' });
                            res.end();
                        }
                    })
                    res.writeHead(302, { 'Location': '/' });
                    res.end();
                }
            }
        })



    } else if (pathname == '/delete') {

        const id = query.id;
        const note = dataDB.filter(res => res.id !== Number(id))
        console.log(id);

        fs.writeFile('./model/noteDB.json', JSON.stringify(note, null, 2), (err) => {
            if (err) {
                res.writeHead(404, { 'content-type': 'text/plain' });
                res.write(`<h1>${err.message}</h1>`);
                res.end();
            }
        })
        res.writeHead(302, { 'Location': '/' });
        res.end();

    } else if (pathname == '/search' && req.method == 'POST') {

        const form = new formidable.IncomingForm();
        form.parse(req, (err, fields, files) => {
            if (err) {
                res.writeHead(500, { 'content-type': 'text/plain' });
                res.write(`<h1>${err.message}</h1>`);
                res.end();
            } else {
                const setSearchValue = fields.search.toString();
                const geSearchValue = dataDB.find(res => res.title.toLowerCase() == setSearchValue.toLowerCase())
                console.log('geSearchValue', geSearchValue)
                res.writeHead(200, { 'content-type': 'text/html' });
                const notes = [geSearchValue].map(res => replaceTemplete(myNotes, res)).join('');
                const indexRoute = indexPage.replace("{%myNotes%}", notes)
                res.end(indexRoute)
            }
        });

    } else if (pathname == '/updatePage') {
        const updateId = query.id;
        const updateNote = dataDB.find(res => res.id == Number(updateId));
        res.writeHead(200, { 'content-type': 'text/html' });
        const takenotes = [updateNote].map(res => replaceTemplete(updateMynotes, res)).join('');
        const indexRoute = updatePage.replace("{%updateMynotes%}", takenotes)
        res.end(indexRoute)
        res.writeHead(302, { 'Location': '/' });
        res.end();
    } else if (pathname == '/update' && req.method == 'POST') {
        const form = new formidable.IncomingForm();
        form.parse(req, (err, fields, files) => {
            if (err) {
                console.log('Error during input fields..');
                res.statusCode = 500;
                res.writeHead(`error ${err.message}`);
                res.end();
            } else {
                const id = fields.id.toString();
                const title = fields.title.toString();
                const description = fields.description.toString();
                const updateNote = dataDB.map(res => {
                    if (res.id == Number(id)) {
                        return {
                            ...res,
                            id: Number(id),
                            title: title,
                            description: description
                        }
                    }
                    return res;
                })
                fs.writeFile('./model/noteDB.json', JSON.stringify(updateNote), (err) => {
                    if (err) {
                        console.log('Error during file writing..');
                        res.statusCode = 500;
                        res.end();
                    } else {
                        console.log('successfully updated..');
                        res.writeHead(302, { 'Location': '/' });
                        res.end();
                    }
                })
                res.writeHead(302, { 'Location': '/' });
                res.end();
            }
        });
    } else {
        res.writeHead(404, { 'content-type': 'text/html' });
        res.write('<h1>OPPS! 404 page not found</h1>')
        res.end();
    }
})

server.listen(PORT, () => {
    console.log(`listening on port ${PORT}`);
})