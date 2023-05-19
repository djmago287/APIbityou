const express = require("express");
const path  = require('path');
const  app = express();
const ytdl = require('ytdl-core');
const fs = require('fs');
const ffmpeg = require("ffmpeg-static");
const archiver = require('archiver');
const { error } = require("console");

let pathfolder = '';
let pathzip = '';
//crea una carpeta random
function Createfolder()
{
  const banco = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let longitud = 5;
  let namefolder = "";
  //generar el nombre randowm
  for (let i = 0; i < longitud; i++) {
    namefolder += banco[Math.round(Math.random()*banco.length)];
  }
  pathfolder = `src/${namefolder}`;
  //crear la carperta
  fs.mkdir(pathfolder,{recursive:true},(error)=>{
    if (error) {
        console.log("Error en crear carpeta");
    }else{
        console.log("Se creo nueva carpeta");
    }
  })

}
function createfolder(res)
{
  //generar el nombre de la carpeta
  const banco="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let namerandom = "";
  let longitud = 5;
  let folderpath ="",namezip = "";
  for (let i = 0; i < longitud; i++) {
      namerandom+=banco[Math.round(Math.random()*(banco.length-1))];
  }
  folderpath= `src/${namerandom}`;

  //crear carpera
  fs.mkdir(folderpath,{recursive:true},(error)=>{
    if(error)
    {
      var error = "Error al crear carpeta"
      return error;
    }
  });
  //crear archivo zip
  namezip = `src/${namerandom}.zip`;
  const zip = fs.createWriteStream(namezip) ;
  const archive = archiver('zip',{
    zlib:{level:9} // el nivel de comprension
  })
  
  //escribir archivo zip
  archive.pipe(zip);
  //insertar archivos al zip
  fs.readdirSync('src/pp').map((file)=>{
    const pathfile = `src/pp/${file}`;
    
    console.log(pathfile);
    archive.file(pathfile,{name:file});
  })
  archive.finalize();
  //proceso de finalizar el envio de file al zip
  zip.on('close',()=>{

    console.log('cargado completo');
    //procesos de descargar con el attachment
    res.attachment(namezip);
    res.on('finish',()=>{
      fs.unlinkSync(namezip);
      fs.rmdirSync(folderpath);
      console.log("termino la descarga");
    })
    res.download(namezip);
  })
 

 
  
}
const downloadmusic = async (folder,url)=>{

  async function gettitle(url)
  {
    try {
      var info = await ytdl.getInfo(url);
      var title = info.videoDetails.title;
      console.log(`Descargando ${title}`);
      return title;
    } catch (error) {
      console.error('Error al obtener el título del video:', error);
    }
  }
  
  const title = await gettitle(url);
  const stream = ytdl(url,{filter:'audioonly'}).pipe(fs.createWriteStream(`${folder}/${title}.mp4`))

  stream.on('finish', ()=>{
    const process = require('child_process').spawn(
      ffmpeg,
      [
        '-i', `${folder}/${title}.mp4`,
        '-vn', '-ab', '128k',
        '-y', `${folder}/${title}.mp3`
      ]
    );

    process.on('close', () => {
     fs.unlinkSync( `${folder}/${title}.mp4`);
      console.log('Download finished');
    });
  })
 
}

app.get('/youtu',(req, res)=>{
 //  createfolder(res);
 //createfolder(res);
   //res.download(createfolder());
  
  Createfolder();

  const Listurl = ['https://www.youtube.com/watch?v=QM-y0-DLJnw'
                ]
  Listurl.map((item)=>{
    downloadmusic(pathfolder,item)
  })
  
  res.send("Se descargo");
 /* Listurl.map((e)=>{
   // console.log(e);
    downloadmusic(e);
  
    var a = "prueba";*/
   
});
//por  defaould manda el
app.use(express.static(path.join(__dirname,'public')))
const server = app.listen(9000,()=>{
    console.log("El puerto esta corriendo")
})