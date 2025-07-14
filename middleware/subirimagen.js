import multer from "multer";
import path from 'path';
import { generalId } from '../helpers/tokens.js';

//destination = destino del archivo, filename nombre del archivo
//path.extname extencion del archivo 
const storage = multer.diskStorage({
    destination: function(req, file, cb){
        cb(null, './public/uploads/')
    },
    filename: function(req, file, cb){
        cb(null, generalId() + path.extname(file.originalname))
    }
})

const upload = multer({storage})

export default upload