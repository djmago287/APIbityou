const express = require("express");
const path  = require('path');
const  app = express();
const ytdl = require('ytdl-core');
const fs = require('fs');
const ffmpeg = require("ffmpeg-static");
const archiver = require('archiver');
const fsextra = require('fs-extra');
const cors = require('cors');

//los middleware permite la seguridad al enviar datos
//app.use(express.json());
//app.use(express.urlencoded({extended:true}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
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
//comprimir en un zip
function compresszip(res)
{
 
  console.log(pathfolder+"comprimiendo");
  //crear archivo zip
  namezip = `${pathfolder}.zip`;
  const zip = fs.createWriteStream(namezip) ;
  const archive = archiver('zip',{
    zlib:{level:9} // el nivel de comprension
  })
  //escribir archivo zip
  archive.pipe(zip);
  //insertar archivos al zip
  fs.readdirSync(pathfolder).map((file)=>{
    const pathfile = `${pathfolder}/${file}`;
   // console.log(pathfile+"---");
  
    archive.file(pathfile,{name:file});
  })
  archive.finalize();
  //proceso de finalizar el envio de file al zip

  zip.on('close',()=>{

    console.log('cargado completo');
    //procesos de descargar con el attachment
    res.attachment(namezip);
    res.on('finish',async()=>{
      fs.unlinkSync(namezip);
      //remover carpeta que tiene archivos
      await fsextra.remove(pathfolder);
      console.log("termino la descarga");
    })
    res.download(namezip);
   // res.send("completo");
  })
}
const downloadmusic = async (folder,url)=>{


  async function gettitle(url)
  {
    try {
      var info = await ytdl.getInfo(url);
      var title = info.videoDetails.title;
      console.log(`Descargando ${title}`);

      return  title.replace(/[^\w\s]/gi, "");
    } catch (error) {
      console.error('Error al obtener el título del video:', error);
    }
  }
  
  const title = await gettitle(url);
  const stream = ytdl(url,{filter:'audioonly'}).pipe(fs.createWriteStream(`${folder}/${title}.mp4`))


  return new Promise((resolve,reject)=>{
    //transformar de video a audio
    stream.on('finish', ()=>{
      const process = require('child_process').spawn(
        ffmpeg,
        [
          '-i', `${folder}/${title}.mp4`,
          '-vn', '-ab', '256k',//128k 64k 192k 256k 320k
          '-y', `${folder}/${title}.mp3`
        ]
      );
  
      process.on('close', () => {
       fs.unlinkSync( `${folder}/${title}.mp4`);
        console.log('Download finished');
        resolve();
      });
    })
  })

 
}
const getdetailmusic = async (url)=>{
  var detailmusic = {
    URL:'',
    title:'',
    thumbnail:''
  }
  try {
    console.log('cargando musica');
    var info = await ytdl.getInfo(url);
 
    detailmusic.URL = url;
    detailmusic.title =  info.videoDetails.title;
    detailmusic.thumbnail = info.videoDetails.thumbnails[0].url;
   // console.log(detailmusic);
    return detailmusic;
    //return detailmusic;
  } catch (error) {
    return {error:'No se reconoce la musica'};
    console.log('Error al obtener los detalles')
  }
}

app.post('/detailmusic',async(req,res)=>{
console.log(req.body.length);
/*const urls = ['https://www.youtube.com/watch?v=of9UbUpMrZA',
  'https://www.youtube.com/watch?v=TOBGbDtbaTw',
  'https://www.youtube.com/watch?v=faOAF5M6DH4'
];*/
var url = req.body.url;
var requestmusic = await getdetailmusic(url);
const data = {
  data :requestmusic,
}

res.json(data);

 
});
app.post('/youtu',async (req, res)=>{
  Createfolder();
  const Listurl = req.body.urls;
  for(const item of Listurl)
  {
    await downloadmusic(pathfolder,item);
  }
  compresszip(res);
});
const PORT = process.env.PORT ?? 9000
//por  defaould manda el
app.use(express.static(path.join(__dirname,'public')))
const server = app.listen(PORT,()=>{
    console.log("El puerto esta corriendo")
})