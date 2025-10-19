import "reflect-metadata";
import { injectable, inject } from "inversify";
import { IIngestor } from "./IIngestor";
import {TYPES} from "../../../types";
import {IDeviceRepository} from "../../../repositories/DeviceRepository";
import {ParserBlock} from "./types";
import {IngestionContext} from "./IngestionContext";

@injectable()
export class SysnameIngestor implements IIngestor {
    readonly blockType = "display_sysname_block";
    readonly priority = 6;

    constructor(
        @inject(TYPES.DeviceRepository) private devRepo: IDeviceRepository
    ) {}

    async ingest(block: ParserBlock, context: IngestionContext): Promise<void> {
        const device = context.device;
        const newSysname = block?.sysname;
        console.log(device);

        if (newSysname && device.hostname !== String(newSysname)) {
            console.log(`[SysnameIngestor] Updating hostname for device ID ${device.id} from '${device.hostname}' to '${newSysname}'.`);
            device.hostname = String(newSysname);
            await this.devRepo.update(device.id, device);
        }
    }
}