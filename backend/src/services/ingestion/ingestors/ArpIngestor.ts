import "reflect-metadata";
import { injectable, inject } from "inversify";
import { IIngestor } from "./IIngestor";
import {IngestionContext} from "./IngestionContext";
import {IARPRecordRepository} from "../../../repositories/ARPRecordRepository";
import {TYPES} from "../../../types";
import {ParserBlock} from "./types";

@injectable()
export class ArpIngestor implements IIngestor {
    readonly blockType = "display_arp_all_block";
    readonly priority = 50;

    constructor(
        @inject(TYPES.ARPRecordRepository) private arpRepo: IARPRecordRepository
    ) {}

    async ingest(block: ParserBlock, context: IngestionContext): Promise<void> {
        const rows = Array.isArray(block?.entries) ? block.entries : [];
        if (rows.length === 0) {
            return;
        }

        const arpRecordsToUpsert = rows.map(row => ({
            device: context.device,
            snapshot: context.snapshot,
            ip_address: row.ip_address,
            mac_address: row.mac_address,
            expire_m: row.expire_m,
            type: row.type,
            interface: row.interface,
            vpn_instance: row.vpn_instance,
            vlan: row.vlan,
            cevlan: row.cevlan,
        }));

        await this.arpRepo.upsert(arpRecordsToUpsert);
        console.log(`[ArpIngestor] Upserted ${arpRecordsToUpsert.length} ARP records.`);
    }
}