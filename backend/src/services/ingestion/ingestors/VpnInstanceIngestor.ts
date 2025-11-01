import "reflect-metadata";
import { injectable, inject } from "inversify";
import { IIngestor } from "./IIngestor";
import {IVpnInstanceRepository} from "../../../repositories/VpnInstanceRepository";
import {TYPES} from "../../../types";
import {ParserBlock} from "./types";
import {IngestionContext} from "./IngestionContext";

@injectable()
export class VpnInstanceIngestor implements IIngestor {
    readonly blockType = "display_ip_vpn_instance_block";
    readonly priority = 210;

    constructor(
        @inject(TYPES.VpnInstanceRepository) private vpnRepo: IVpnInstanceRepository
    ) {}

    async ingest(block: ParserBlock, context: IngestionContext): Promise<void> {
        const instances = Array.isArray(block?.vpn_instances) ? block.vpn_instances : [];
        if (instances.length === 0) return;

        const instancesToUpsert = instances.map(instance => ({
            snapshot: context.snapshot,
            device: context.device,
            name: instance.name,
            address_family: instance.family,
            rd: instance.rd && instance.rd.trim() !== '' ? instance.rd.trim() : null,
        }));

        await this.vpnRepo.upsert(instancesToUpsert);
        console.log(`[VpnInstanceIngestor] Upserted ${instancesToUpsert.length} VPN instances.`);
    }
}