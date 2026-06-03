import PDFDocument from 'pdfkit';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';

export async function generatePDF(report) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const doc = new PDFDocument({ margin: 50 });
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(24).text(report.topic, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text('Autonomous AI Research Report', { align: 'center' });
    doc.text(`Generated: ${new Date(report.createdAt || Date.now()).toLocaleDateString()}`, {
      align: 'center',
    });
    doc.addPage();

    doc.fontSize(16).text('Executive Summary', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).text(report.executiveSummary || '', { align: 'justify' });
    doc.addPage();

    doc.fontSize(16).text('Table of Contents', { underline: true });
    doc.moveDown(0.5);
    (report.outline || []).forEach((item, i) => {
      doc.fontSize(11).text(`${i + 1}. ${item.title}`);
    });
    doc.addPage();

    (report.sections || []).forEach((section) => {
      doc.fontSize(14).text(section.title, { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11).text(section.content || '', { align: 'justify' });
      doc.moveDown();
    });

    doc.addPage();
    doc.fontSize(16).text('References', { underline: true });
    doc.moveDown(0.5);
    (report.references || []).forEach((ref, i) => {
      doc.fontSize(10).text(`[${i + 1}] ${ref.title} - ${ref.source}`);
      if (ref.excerpt) doc.fontSize(9).fillColor('#555').text(ref.excerpt);
      doc.fillColor('#000');
      doc.moveDown(0.3);
    });

    doc.end();
  });
}

export async function generateDOCX(report) {
  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: report.topic, bold: true, size: 48 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Autonomous AI Research Report', size: 24 })],
    }),
    new Paragraph({ text: '' }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun('Executive Summary')],
    }),
    new Paragraph({ children: [new TextRun(report.executiveSummary || '')] }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun('Table of Contents')],
    }),
    ...(report.outline || []).map(
      (item, i) =>
        new Paragraph({ children: [new TextRun(`${i + 1}. ${item.title}`)] })
    ),
    ...(report.sections || []).flatMap((section) => [
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [new TextRun(section.title)],
      }),
      new Paragraph({ children: [new TextRun(section.content || '')] }),
    ]),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun('References')],
    }),
    ...(report.references || []).map(
      (ref, i) =>
        new Paragraph({
          children: [new TextRun(`[${i + 1}] ${ref.title} - ${ref.source}`)],
        })
    ),
  ];

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}
