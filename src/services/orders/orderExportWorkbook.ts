import ExcelJS from 'exceljs';
import type { OrderExport } from './orderExportService';

const logoUrl = new URL('../../assets/adit-export-logo.png', import.meta.url).href;

const COLORS = {
  ink: 'FF06232A',
  teal: 'FF21383D',
  lime: 'FFD7FF00',
  paleLime: 'FFF4FFD0',
  pale: 'FFF5F8F8',
  line: 'FFE0E7E8',
  muted: 'FF607176',
  white: 'FFFFFFFF',
  green: 'FFE5F6EA',
  greenText: 'FF17633B',
  amber: 'FFFFF3D6',
  amberText: 'FF805A00',
  red: 'FFFFE8E6',
  redText: 'FF9D3129',
} as const;

const formatDate = (date: string) => {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const getStatusColors = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized.includes('cancel') || normalized.includes('reject')) {
    return { fill: COLORS.red, font: COLORS.redText };
  }
  if (normalized.includes('complete') || normalized.includes('deliver')) {
    return { fill: COLORS.green, font: COLORS.greenText };
  }
  if (normalized.includes('pending') || normalized.includes('process')) {
    return { fill: COLORS.amber, font: COLORS.amberText };
  }
  return { fill: COLORS.paleLime, font: COLORS.ink };
};

export async function createDailyExportWorkbook(
  date: string,
  orders: OrderExport[],
): Promise<Blob> {
  const logoResponse = await fetch(logoUrl);
  if (!logoResponse.ok) {
    throw new Error('Unable to load the ADIT logo for the Excel report.');
  }
  const logoBuffer = await logoResponse.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'ADIT Holdings';
  workbook.subject = `Order export for ${date}`;
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Order Report', {
    views: [{ state: 'frozen', ySplit: 8, topLeftCell: 'A9', activeCell: 'A9' }],
    pageSetup: {
      paperSize: 9,
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      horizontalCentered: true,
    },
    properties: { defaultRowHeight: 24 },
  });

  worksheet.columns = [
    { key: 'customerId', width: 14 },
    { key: 'name', width: 25 },
    { key: 'address', width: 38 },
    { key: 'contact01', width: 17 },
    { key: 'contact02', width: 17 },
    { key: 'date', width: 16 },
    { key: 'waybillId', width: 19 },
    { key: 'price', width: 17 },
    { key: 'status', width: 19 },
  ];

  worksheet.mergeCells('A1:B3');
  worksheet.mergeCells('C1:I1');
  worksheet.mergeCells('C2:I2');
  worksheet.getRow(1).height = 30;
  worksheet.getRow(2).height = 25;
  worksheet.getRow(3).height = 18;

  const titleCell = worksheet.getCell('C1');
  titleCell.value = 'ORDER EXPORT REPORT';
  titleCell.font = { name: 'Aptos Display', size: 20, bold: true, color: { argb: COLORS.ink } };
  titleCell.alignment = { vertical: 'middle' };

  const subtitleCell = worksheet.getCell('C2');
  subtitleCell.value = `Daily order register  |  ${formatDate(date)}`;
  subtitleCell.font = { name: 'Aptos', size: 11, color: { argb: COLORS.muted } };
  subtitleCell.alignment = { vertical: 'middle' };

  const imageId = workbook.addImage({
    buffer: logoBuffer,
    extension: 'png',
  });
  worksheet.addImage(imageId, {
    tl: { col: 0.12, row: 0.12 },
    ext: { width: 166, height: 58 },
  });

  worksheet.getRow(4).height = 5;
  for (let column = 1; column <= 9; column += 1) {
    worksheet.getCell(4, column).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: column <= 2 ? COLORS.lime : COLORS.teal },
    };
  }

  const metricCards = [
    { columns: ['A', 'C'], label: 'REPORT DATE', value: formatDate(date) },
    { columns: ['D', 'F'], label: 'TOTAL ORDERS', value: orders.length },
    {
      columns: ['G', 'I'],
      label: 'TOTAL SALES',
      value: orders.reduce((total, order) => total + Number(order.price || 0), 0),
    },
  ] as const;

  metricCards.forEach(({ columns, label, value }) => {
    const [start, end] = columns;
    worksheet.mergeCells(`${start}5:${end}5`);
    worksheet.mergeCells(`${start}6:${end}6`);
    const labelCell = worksheet.getCell(`${start}5`);
    labelCell.value = label;
    labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.pale } };
    labelCell.font = { name: 'Aptos', size: 9, bold: true, color: { argb: COLORS.muted } };
    labelCell.alignment = { horizontal: 'left', vertical: 'middle' };

    const valueCell = worksheet.getCell(`${start}6`);
    valueCell.value = value;
    valueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.pale } };
    valueCell.font = { name: 'Aptos Display', size: 15, bold: true, color: { argb: COLORS.ink } };
    valueCell.alignment = { horizontal: 'left', vertical: 'middle' };
    if (label === 'TOTAL SALES') {
      valueCell.numFmt = '"Rs. " #,##0.00';
    }
  });

  worksheet.getRow(5).height = 20;
  worksheet.getRow(6).height = 31;
  worksheet.getRow(7).height = 12;

  const headers = [
    'Customer Id',
    'Name',
    'Address',
    'Contact 01',
    'Contact 02',
    'Date',
    'Waybill Id',
    'Price (Rs.)',
    'Status',
  ];
  const headerRow = worksheet.getRow(8);
  headerRow.values = headers;
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.teal } };
    cell.font = { name: 'Aptos', size: 10, bold: true, color: { argb: COLORS.white } };
    cell.alignment = { vertical: 'middle', wrapText: true };
    cell.border = { bottom: { style: 'medium', color: { argb: COLORS.lime } } };
  });

  const dataStartRow = 9;
  orders.forEach((order, index) => {
    const row = worksheet.getRow(dataStartRow + index);
    row.values = [
      order.customerId ?? '',
      order.name ?? '',
      order.address ?? '',
      order.contact01 ?? '',
      order.contact02 ?? '',
      order.date?.slice(0, 10) ?? date,
      order.waybillId ?? '',
      Number(order.price ?? 0),
      order.status ?? '',
    ];
    row.height = 27;
    row.eachCell((cell, columnNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: index % 2 === 0 ? COLORS.white : COLORS.pale },
      };
      cell.font = { name: 'Aptos', size: 10, color: { argb: COLORS.ink } };
      cell.alignment = {
        vertical: 'middle',
        horizontal: columnNumber === 8 ? 'right' : 'left',
        wrapText: columnNumber === 3,
      };
      cell.border = { bottom: { style: 'hair', color: { argb: COLORS.line } } };
    });
    row.getCell(8).numFmt = '"Rs. " #,##0.00';
    row.getCell(9).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: getStatusColors(String(order.status ?? '')).fill },
    };
    row.getCell(9).font = {
      name: 'Aptos',
      size: 10,
      bold: true,
      color: { argb: getStatusColors(String(order.status ?? '')).font },
    };
  });

  if (orders.length === 0) {
    worksheet.mergeCells('A9:I9');
    const emptyCell = worksheet.getCell('A9');
    emptyCell.value = 'No orders were recorded for this date.';
    emptyCell.font = { name: 'Aptos', size: 11, italic: true, color: { argb: COLORS.muted } };
    emptyCell.alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(9).height = 34;
  }

  const lastDataRow = orders.length ? dataStartRow + orders.length - 1 : dataStartRow;
  worksheet.autoFilter = { from: 'A8', to: `I${Math.max(lastDataRow, 8)}` };

  const summaryTitleRow = lastDataRow + 2;
  worksheet.mergeCells(`A${summaryTitleRow}:I${summaryTitleRow}`);
  const summaryTitle = worksheet.getCell(`A${summaryTitleRow}`);
  summaryTitle.value = 'DAILY SUMMARY';
  summaryTitle.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.teal } };
  summaryTitle.font = { name: 'Aptos', size: 10, bold: true, color: { argb: COLORS.white } };
  summaryTitle.alignment = { vertical: 'middle' };
  summaryTitle.border = { left: { style: 'medium', color: { argb: COLORS.lime } } };
  worksheet.getRow(summaryTitleRow).height = 25;

  const summaryCards = [
    { columns: ['A', 'C'], label: 'REPORT DATE', value: formatDate(date) },
    { columns: ['D', 'F'], label: 'ORDERS', value: orders.length },
    {
      columns: ['G', 'I'],
      label: 'TOTAL SALES',
      value: orders.reduce((total, order) => total + Number(order.price || 0), 0),
    },
  ] as const;
  summaryCards.forEach(({ columns, label, value }) => {
    const [start, end] = columns;
    const labelRow = summaryTitleRow + 1;
    const valueRow = summaryTitleRow + 2;
    worksheet.mergeCells(`${start}${labelRow}:${end}${labelRow}`);
    worksheet.mergeCells(`${start}${valueRow}:${end}${valueRow}`);

    const labelCell = worksheet.getCell(`${start}${labelRow}`);
    labelCell.value = label;
    labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.pale } };
    labelCell.font = { name: 'Aptos', size: 9, bold: true, color: { argb: COLORS.muted } };
    labelCell.alignment = { vertical: 'middle' };

    const valueCell = worksheet.getCell(`${start}${valueRow}`);
    valueCell.value = value;
    valueCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.paleLime } };
    valueCell.font = { name: 'Aptos Display', size: 14, bold: true, color: { argb: COLORS.ink } };
    valueCell.alignment = { vertical: 'middle' };
    if (label === 'TOTAL SALES') {
      valueCell.numFmt = '"Rs. " #,##0.00';
    }
  });
  worksheet.getRow(summaryTitleRow + 1).height = 20;
  worksheet.getRow(summaryTitleRow + 2).height = 30;

  const generatedRow = summaryTitleRow + 4;
  worksheet.mergeCells(`A${generatedRow}:I${generatedRow}`);
  const generatedCell = worksheet.getCell(`A${generatedRow}`);
  generatedCell.value = `ADIT HOLDINGS  •  Order report generated ${new Date().toLocaleString('en-GB')}`;
  generatedCell.font = { name: 'Aptos', size: 9, color: { argb: COLORS.muted } };
  generatedCell.alignment = { horizontal: 'center', vertical: 'middle' };
  worksheet.getRow(generatedRow).height = 22;

  worksheet.pageSetup.printArea = `A1:I${generatedRow}`;
  worksheet.pageSetup.margins = {
    left: 0.25,
    right: 0.25,
    top: 0.4,
    bottom: 0.4,
    header: 0.2,
    footer: 0.2,
  };
  worksheet.headerFooter.oddFooter = '&LADIT HOLDINGS&COrder Export Report&RPage &P of &N';

  const buffer = await workbook.xlsx.writeBuffer();
  const output = new Uint8Array(buffer);
  const fileBuffer = new ArrayBuffer(output.byteLength);
  new Uint8Array(fileBuffer).set(output);

  return new Blob([fileBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}
