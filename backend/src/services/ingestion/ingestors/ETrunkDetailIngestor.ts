import "reflect-metadata";
import { injectable, inject } from "inversify";
import { IIngestor } from "./IIngestor";
import { IngestionContext } from "./IngestionContext";
import { ParserBlock } from "./types";
import { TYPES } from "../../../types";
import { IETrunkRepository } from "../../../repositories/ETrunkRepository";

@injectable()
export class ETrunkDetailIngestor implements IIngestor {
    readonly blockType = "display_etrunk_detail_block";
    readonly priority = 65;

    constructor(
        @inject(TYPES.ETrunkRepository) private etrunkRepo: IETrunkRepository
    ) {}

    async ingest(block: ParserBlock, context: IngestionContext): Promise<void> {
        const etrunkInfo = block?.etrunk_info;
        if (!etrunkInfo || typeof etrunkInfo['e-trunk-id'] !== 'number') {
            return;
        }

        const members = Array.isArray(block?.members) ? block.members : [];

        const etrunkToUpsert = {
            device: context.device,
            snapshot: context.snapshot,
            etrunk_id: etrunkInfo['e-trunk-id'],
            state: etrunkInfo.state || null,
            vpn_instance: etrunkInfo['vpn-instance'] || null,
            peer_ip: etrunkInfo['peer-ip'] || null,
            source_ip: etrunkInfo['source-ip'] || null,
            priority: typeof etrunkInfo.priority === 'number' ? etrunkInfo.priority : null,
            system_id: etrunkInfo['system-id'] || null,
            peer_system_id: etrunkInfo['peer-system-id'] || null,
            peer_priority: typeof etrunkInfo['peer-priority'] === 'number' ? etrunkInfo['peer-priority'] : null,
            causation: etrunkInfo.causation || null,
            revert_delay_time_s: typeof etrunkInfo['revert-delay-time_s'] === 'number' ? etrunkInfo['revert-delay-time_s'] : null,
            send_period_100ms: typeof etrunkInfo['send-period_100ms'] === 'number' ? etrunkInfo['send-period_100ms'] : null,
            fail_time_100ms: typeof etrunkInfo['fail-time_100ms'] === 'number' ? etrunkInfo['fail-time_100ms'] : null,
            peer_fail_time_100ms: typeof etrunkInfo['peer-fail-time_100ms'] === 'number' ? etrunkInfo['peer-fail-time_100ms'] : null,
            receive: typeof etrunkInfo.receive === 'number' ? etrunkInfo.receive : null,
            send: typeof etrunkInfo.send === 'number' ? etrunkInfo.send : null,
            recdrop: typeof etrunkInfo.recdrop === 'number' ? etrunkInfo.recdrop : null,
            snddrop: typeof etrunkInfo.snddrop === 'number' ? etrunkInfo.snddrop : null,
            etrunk_info: etrunkInfo,
            members: members,
        };

        await this.etrunkRepo.upsert([etrunkToUpsert]);
        console.log(`[ETrunkDetailIngestor] Upserted E-Trunk ${etrunkToUpsert.etrunk_id} with details.`);
    }
}

