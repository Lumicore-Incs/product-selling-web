import * as XLSX from 'xlsx';

export interface TrackingRow {
  orderDate: string;
  waybillId: string;
  orderId: string;
  customerName: string;
  deliveryAddress: string;
  phoneNumber: string;
  status: string;
}

export function parseTrackingExcel(file: File): Promise<TrackingRow[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const json: any[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
      const mapped: TrackingRow[] = json.map(row => ({
        orderDate: row['Order Date'] || '',
        waybillId: row['Waybill Id'] || '',
        orderId: row['Order ID'] || '',
        customerName: row['Customer Name'] || '',
        deliveryAddress: row['Delivery Address'] || '',
        phoneNumber: row['Phone Number'] || '',
        status: row['Status'] || '',
      }));
      resolve(mapped);
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}
