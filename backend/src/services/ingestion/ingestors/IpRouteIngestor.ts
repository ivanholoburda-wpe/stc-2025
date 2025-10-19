import "reflect-metadata";
import { injectable, inject } from "inversify";
import { IIngestor } from "./IIngestor";
import {TYPES} from "../../../types";
import {IIpRouteRepository} from "../../../repositories/IpRouteRepository";
import {ParserBlock} from "./types";
import {IngestionContext} from "./IngestionContext";

@injectable()
export class IpRouteIngestor implements IIngestor {
    readonly blockType = "display_ip_routing_table_block";
    readonly priority = 160;

    constructor(
        @inject(TYPES.IpRouteRepository) private routeRepo: IIpRouteRepository
    ) {}

    async ingest(block: ParserBlock, context: IngestionContext): Promise<void> {
        const routes = Array.isArray(block?.routes) ? block.routes : [];
        if (routes.length === 0) return;

        const routesToUpsert = routes.map(route => {
            const interfaceName = String(route.interface);
            const parentInterface = context.interfaceCache.get(interfaceName);

            return {
                device: context.device,
                snapshot: context.snapshot,
                interface: parentInterface || null,

                destination_mask: route.destination_mask,
                protocol: route.protocol,
                preference: route.preference,
                cost: route.cost,
                flags: route.flags,
                next_hop: route.next_hop,
            };
        });

        if (routesToUpsert.length > 0) {
            await this.routeRepo.upsert(routesToUpsert);
            console.log(`[IpRouteIngestor] Upserted ${routesToUpsert.length} IP routes.`);
        }
    }
}