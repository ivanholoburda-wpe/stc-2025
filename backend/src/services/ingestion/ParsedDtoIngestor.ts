import type { Repository } from "typeorm";
import { Snapshot } from "../../models/Snapshot";
import { Device } from "../../models/Device";
import { Interface } from "../../models/Interface";
import { Transceiver } from "../../models/Transceiver";
import { DeviceNeighbor } from "../../models/DeviceNeighbor";
import { AppDataSource } from "../../database/data-source";
import type { DataSource as TypeOrmDataSource } from "typeorm";

type ParserBlock = {
  type?: string;
  [k: string]: any;
};

type ParserResults = {
  success: boolean;
  data: Array<ParserBlock>;
  [k: string]: any;
};

export class ParsedDtoIngestor {
  private ifaceRepo: Repository<Interface>;
  private trxRepo: Repository<Transceiver>;
  private devRepo: Repository<Device>;
  private neighRepo: Repository<DeviceNeighbor>;

  constructor(private readonly dataSource: TypeOrmDataSource = AppDataSource) {
    this.ifaceRepo = this.dataSource.getRepository(Interface);
    this.trxRepo = this.dataSource.getRepository(Transceiver);
    this.devRepo = this.dataSource.getRepository(Device);
    this.neighRepo = this.dataSource.getRepository(DeviceNeighbor);
  }

  async ingest(results: ParserResults, snapshot: Snapshot, device: Device): Promise<void> {
    if (!results?.data || !Array.isArray(results.data)) return;

    // Define strict ingestion order to satisfy dependencies
    const processingOrder = [
      "display_version",                 // update device model/hostname early
      "display_interface_brief_block",  // ensure interfaces exist
      "display_transceiver_verbose_block", // attach transceivers to interfaces
      "display_lldp_neighbor_brief_block", // neighbors last
    ];

    for (const type of processingOrder) {
      for (const block of results.data) {
        if (block?.type !== type) continue;
        switch (type) {
          case "display_version":
            await this.ingestDeviceVersion(block, device);
            break;
          case "display_interface_brief_block":
            await this.ingestInterfacesBrief(block, snapshot, device);
            break;
          case "display_transceiver_verbose_block":
            await this.ingestTransceiverVerbose(block, snapshot, device);
            break;
          case "display_lldp_neighbor_brief_block":
            await this.ingestNeighbors(block, device);
            break;
        }
      }
    }

    // Optionally process any unknown types afterwards (no-op for now)
  }

  private async ingestDeviceVersion(block: ParserBlock, device: Device): Promise<void> {
    // Try to update hostname/model if available in this block
    const maybeModel = block?.vrp?.platform || block?.model;
    if (maybeModel) {
      device.model = String(maybeModel);
      await this.devRepo.save(device);
    }
    const sysname = block?.sysname || block?.hostname; // future-proof if a parser adds sysname
    if (sysname) {
      device.hostname = String(sysname);
      await this.devRepo.save(device);
    }
  }

  private async ingestInterfacesBrief(block: ParserBlock, snapshot: Snapshot, device: Device): Promise<void> {
    const rows = Array.isArray(block?.interfaces) ? block.interfaces : [];
    for (const row of rows) {
      const name = String(row.interface);
      // Upsert by (device, snapshot, name)
      let iface = await this.ifaceRepo.findOne({
        where: { name, device: { id: device.id }, snapshot: { id: snapshot.id } },
        relations: ["device", "snapshot"],
      });
      if (!iface) {
        iface = this.ifaceRepo.create({ name, snapshot, device });
      }
      iface.phy_status = row.phy_status ? String(row.phy_status) : iface.phy_status;
      iface.protocol_status = row.protocol_status ? String(row.protocol_status) : iface.protocol_status;
      await this.ifaceRepo.save(iface);
    }
  }

  private async ingestTransceiverVerbose(block: ParserBlock, snapshot: Snapshot, device: Device): Promise<void> {
    const ifaceName: string | undefined = block?.interface;
    if (!ifaceName) return;

    // Find or create interface for this transceiver (order-independent)
    let iface = await this.ifaceRepo.findOne({
      where: { name: ifaceName, device: { id: device.id }, snapshot: { id: snapshot.id } },
      relations: ["device", "snapshot"],
    });
    if (!iface) {
      iface = this.ifaceRepo.create({ name: ifaceName, device, snapshot });
      await this.ifaceRepo.save(iface);
    }

    // Upsert transceiver by (device, snapshot, interface)
    let tx = await this.trxRepo.findOne({
      where: { interface: { id: iface.id }, device: { id: device.id }, snapshot: { id: snapshot.id } },
      relations: ["interface", "device", "snapshot"],
    });
    if (!tx) {
      tx = this.trxRepo.create({
        name: `${ifaceName} transceiver`,
        interface: iface,
        device,
        snapshot,
      });
    }

    // Map a few well-known fields when available
    const diag = block?.diagnostic_information || {};
    const common = block?.common_information || {};
    if (typeof common.wavelength === "number") tx.wavelength = common.wavelength;
    if (typeof diag["tx_power"] === "number") tx.tx_power = diag["tx_power"];
    if (typeof diag["rx_power"] === "number") tx.rx_power = diag["rx_power"];

    await this.trxRepo.save(tx);
  }

  private async ingestNeighbors(block: ParserBlock, device: Device): Promise<void> {
    // Placeholder: when neighbors are matched to other devices, create links
    // For now we skip creating DeviceNeighbor rows as we need cross-device resolution.
    return;
  }
}

export default ParsedDtoIngestor;


