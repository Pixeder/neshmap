import { pdf } from 'pdf-to-img';
import fs from 'fs';

async function convertPdf() {
  try {
    // Load your PDF file
    const document = await pdf('sample.pdf', { scale: 3 });
    
    let pageNumber = 1;
    // Iterate through the pages and save them
    for await (const imageBuffer of document) {
      fs.writeFileSync(`page-${pageNumber}.png`, imageBuffer);
      console.log(`Saved page ${pageNumber}`);
      pageNumber++;
    }
    console.log('PDF conversion finished successfully!');
  } catch (error) {
    console.error('Error converting PDF:', error);
  }
}

convertPdf();
