import * as xlsx from 'xlsx';
import { injectable } from 'inversify';
import { AppDataSource } from '../../database/data-source';
import { Interface } from '../../models/Interface';
import { ARPRecord } from '../../models/ARPRecord';
import { PhysicalLink } from '../../models/PhysicalLink';

function addSheet(workbook: xlsx.WorkBook, sheetName: string, data: Array<Record<string, any>>) {
  if (!data || data.length === 0) return;
  const cleaned = data.map((row) => {
    const out: Record<string, any> = {};
    for (const key in row) out[key] = row[key] === undefined ? '' : row[key];
    return out;
  });
  const ws = xlsx.utils.json_to_sheet(cleaned);
  xlsx.utils.book_append_sheet(workbook, ws, sheetName);
}

export async function exportFlatNetworkReport(snapshotId: number, filePath: string) {
  console.log(`[exportFlatNetworkReport] start snapshotId=${snapshotId}`);

  const [interfaces, arpRecords, physicalLinks] = await Promise.all([
    AppDataSource.getRepository(Interface).find({
      where: { snapshot: { id: snapshotId } },
      relations: ['device', 'transceivers'],
    }),
    AppDataSource.getRepository(ARPRecord).find({ where: { snapshot: { id: snapshotId } } }),
    AppDataSource.getRepository(PhysicalLink).find({
      where: { snapshot: { id: snapshotId } },
      relations: ['source_interface', 'source_interface.device', 'target_interface', 'target_interface.device'],
    }),
  ]);

  const arpMap = new Map<string, ARPRecord>();
  for (const arp of arpRecords) if (arp.ip_address) arpMap.set(arp.ip_address, arp);

  type NeighborInfo = { neighborHostname: string; neighborInterface: string };
  const neighborMap = new Map<number, NeighborInfo>();
  for (const link of physicalLinks) {
    const s = link.source_interface; const t = link.target_interface;
    if (s?.device && t?.device) {
      neighborMap.set(s.id, { neighborHostname: t.device.hostname, neighborInterface: t.name });
      neighborMap.set(t.id, { neighborHostname: s.device.hostname, neighborInterface: s.name });
    }
  }

  const flatData = interfaces.map((iface) => {
    const transceiver = iface.transceivers?.[0];
    const arp = iface.ip_address ? arpMap.get(iface.ip_address) : undefined;
    const neighbor = neighborMap.get(iface.id);
    return {
      Hostname: iface.device?.hostname,
      Interface: iface.name,
      Description: iface.description,
      'IP Address': iface.ip_address,
      'MAC Address': arp?.mac_address,
      VLAN: (arp as any)?.vlan,
      Status: iface.phy_status,
      Protocol: iface.protocol_status,
      MTU: iface.mtu,
      Neighbor: neighbor?.neighborHostname,
      'Remote Interface': neighbor?.neighborInterface,
      Vendor: transceiver?.vendor_pn,
      'S/N': transceiver?.serial_number,
      Type: transceiver?.type,
      'Wavelength (nm)': transceiver?.wavelength,
      'Tx Power (dBm)': transceiver?.tx_power,
      'Rx Power (dBm)': transceiver?.rx_power,
    } as Record<string, any>;
  });

  const wb = xlsx.utils.book_new();
  addSheet(wb, 'Network Report', flatData);
  xlsx.writeFile(wb, filePath);
  console.log(`[exportFlatNetworkReport] saved to ${filePath}`);
}

export interface IExportService {
  exportFlatReport(snapshotId: number, filePath: string): Promise<void>;
}

@injectable()
export class ExportService implements IExportService {
  async exportFlatReport(snapshotId: number, filePath: string): Promise<void> {
    await exportFlatNetworkReport(snapshotId, filePath);
  }
}
