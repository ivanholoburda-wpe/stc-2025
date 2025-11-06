import "reflect-metadata";
import { injectable, inject } from "inversify";
import { IIngestor } from "./IIngestor";
import { IngestionContext } from "./IngestionContext";
import { ParserBlock } from "./types";
import {TYPES} from "../../../types";
import {IDeviceRepository} from "../../../repositories/DeviceRepository";
import {IHardwareComponentRepository} from "../../../repositories/HardwareComponentRepository";
import {IInventoryDaughterBoardRepository} from "../../../repositories/InventoryDaughterBoardRepository";
import {IInventoryPortRepository} from "../../../repositories/InventoryPortRepository";

@injectable()
export class InventoryIngestor implements IIngestor {
    readonly blockType = "display_elabel_block";
    readonly priority = 60;

    constructor(
        @inject(TYPES.DeviceRepository) private deviceRepo: IDeviceRepository,
        @inject(TYPES.HardwareComponentRepository) private hwRepo: IHardwareComponentRepository,
        @inject(TYPES.InventoryDaughterBoardRepository) private daughterBoardRepo: IInventoryDaughterBoardRepository,
        @inject(TYPES.InventoryPortRepository) private portRepo: IInventoryPortRepository
    ) {}

    async ingest(block: ParserBlock, context: IngestionContext): Promise<void> {
        // Обработка backplane - дополняем Device
        if (block.backplane) {
            await this.deviceRepo.update(context.device.id, {
                backplane_boardtype: block.backplane.boardtype,
                backplane_barcode: block.backplane.barcode,
                backplane_item: block.backplane.item,
                backplane_description: block.backplane.description,
                backplane_manufactured: block.backplane.manufactured,
                backplane_vendorname: block.backplane.vendorname,
                backplane_issuenumber: block.backplane.issuenumber,
                backplane_cleicode: block.backplane.cleicode,
                backplane_bom: block.backplane.bom,
            });
        }

        // Обработка slots с main_boards и daughter_boards
        const slots = Array.isArray(block?.slots) ? block.slots : [];
        const hwComponentsToUpdate: any[] = [];
        const daughterBoardsToUpsert: any[] = [];
        const portsToUpsert: any[] = [];

        for (const slot of slots) {
            // Обработка main_boards - дополняем HardwareComponent
            const mainBoards = Array.isArray(slot?.main_boards) ? slot.main_boards : [];
            // Берем первую main board для обновления HardwareComponent (так как уникальность по slot)
            if (mainBoards.length > 0) {
                const firstMainBoard = mainBoards[0];
                hwComponentsToUpdate.push({
                    device: context.device,
                    snapshot: context.snapshot,
                    slot: slot.slot_number,
                    inventory_boardtype: firstMainBoard.boardtype,
                    inventory_barcode: firstMainBoard.barcode,
                    inventory_item: firstMainBoard.item,
                    inventory_description: firstMainBoard.description,
                    inventory_manufactured: firstMainBoard.manufactured,
                    inventory_vendorname: firstMainBoard.vendorname,
                    inventory_issuenumber: firstMainBoard.issuenumber,
                    inventory_cleicode: firstMainBoard.cleicode,
                    inventory_bom: firstMainBoard.bom,
                });
            }

            // Обработка daughter_boards - сохраняем в отдельную таблицу
            const daughterBoards = Array.isArray(slot?.daughter_boards) ? slot.daughter_boards : [];
            for (const daughterBoard of daughterBoards) {
                daughterBoardsToUpsert.push({
                    device: context.device,
                    snapshot: context.snapshot,
                    slot_number: daughterBoard.slot_number || slot.slot_number,
                    sub_slot: daughterBoard.sub_slot,
                    boardtype: daughterBoard.boardtype,
                    barcode: daughterBoard.barcode,
                    item: daughterBoard.item,
                    description: daughterBoard.description,
                    manufactured: daughterBoard.manufactured,
                    vendorname: daughterBoard.vendorname,
                    issuenumber: daughterBoard.issuenumber,
                    cleicode: daughterBoard.cleicode,
                    bom: daughterBoard.bom,
                });

                // Обработка ports в daughter_board
                const ports = Array.isArray(daughterBoard?.ports) ? daughterBoard.ports : [];
                for (const port of ports) {
                    portsToUpsert.push({
                        device: context.device,
                        snapshot: context.snapshot,
                        slot_number: daughterBoard.slot_number || slot.slot_number,
                        sub_slot: daughterBoard.sub_slot,
                        port_number: port.port_number,
                        boardtype: port.boardtype,
                        barcode: port.barcode,
                        item: port.item,
                        description: port.description,
                        manufactured: port.manufactured,
                        vendorname: port.vendorname,
                        issuenumber: port.issuenumber,
                        cleicode: port.cleicode,
                        bom: port.bom,
                    });
                }
            }
        }

        // Обновляем HardwareComponent с inventory данными
        if (hwComponentsToUpdate.length > 0) {
            await this.hwRepo.upsert(hwComponentsToUpdate);
        }

        // Сохраняем daughter boards
        if (daughterBoardsToUpsert.length > 0) {
            await this.daughterBoardRepo.upsert(daughterBoardsToUpsert);
        }

        // Сохраняем ports
        if (portsToUpsert.length > 0) {
            await this.portRepo.upsert(portsToUpsert);
        }

        console.log(`[InventoryIngestor] Updated device backplane, ${hwComponentsToUpdate.length} hardware component(s), ${daughterBoardsToUpsert.length} daughter board(s), ${portsToUpsert.length} port(s).`);
    }
}

