//It only stores the PDF's metadata and where the actual file is stored.

/**
 * It does not tell us:

which exact chunking algorithm to use
whether 1000 is mandatory
whether 150 is mandatory
whether chunking should happen by paragraph first
how page numbers should be calculated
whether there is already a shared utility somewhere in the project
 */
/**from db schema: 
 * page_start
    page_end

Those may be intended for later search/preview functionality
 */

import multer from "multer";
import crypto from "crypto";
import { createDocumentMulterErrorHandler } from "../../../middleware/multerError-handler.js";

let storage = multer.diskStorage({
  destination: "uploads/rag",
  filename: (req, file, cb) => {
    let unquesName = crypto.randomBytes(8).toString("hex") + ".pdf";
    cb(null, unquesName);
  },
});

let fileFilter = (req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only PDF files are allowed."));
  }
};
let maxSize = process.env.RAG_MAX_UPLOAD_MB;
export let upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: maxSize * 1024 * 1024,
  },
});

export let uploadDocument = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err) {
      return createDocumentMulterErrorHandler(err, req, res, next);
    }

    next();
  });
}; /*upload.single("file") returns a middleware function. By writing upload.single("file")(req, res, callback), we immediately call that returned middleware and provide our own callback as its next function, allowing us to receive and handle Multer's error before deciding whether to pass control to Express.*/
