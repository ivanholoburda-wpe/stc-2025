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

                destination_mask: route.destination_mask || route.network || '',
                protocol: route.protocol || 'BGP',
                preference: route.preference || 0,
                cost: route.cost || 0,
                flags: route.flags || route.status || '',
                next_hop: route.next_hop,
                status: route.status || null,
                network: route.network || null,
                prefix_len: route.prefix_len || null,
                loc_prf: route.loc_prf || null,
                med: route.med ? String(route.med) : null,
                pref_val: route.pref_val || null,
                path_ogn: route.path_ogn || null,
                label: route.label || null,
                route_distinguisher: route.route_distinguisher || route.rd || null,
                vpn_instance: route.vpn_instance || null,
            };
        });

        if (routesToUpsert.length > 0) {
            await this.routeRepo.upsert(routesToUpsert);
            console.log(`[IpRouteIngestor] Upserted ${routesToUpsert.length} IP routes.`);
        }
    }
}