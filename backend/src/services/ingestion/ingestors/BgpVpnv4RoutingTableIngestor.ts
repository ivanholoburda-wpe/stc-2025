import "reflect-metadata";
import { injectable, inject } from "inversify";
import { IIngestor } from "./IIngestor";
import { IngestionContext } from "./IngestionContext";
import { ParserBlock } from "./types";
import {TYPES} from "../../../types";
import {IIpRouteRepository} from "../../../repositories/IpRouteRepository";

@injectable()
export class BgpVpnv4RoutingTableIngestor implements IIngestor {
    readonly blockType = "display_bgp_vpnv4_routing_table_block";
    readonly priority = 161;

    constructor(
        @inject(TYPES.IpRouteRepository) private routeRepo: IIpRouteRepository
    ) {}

    async ingest(block: ParserBlock, context: IngestionContext): Promise<void> {
        const routeDistinguishers = Array.isArray(block?.route_distinguishers) ? block.route_distinguishers : [];
        if (routeDistinguishers.length === 0) return;

        const routesToUpsert: any[] = [];

        for (const rd of routeDistinguishers) {
            const routes = Array.isArray(rd.routes) ? rd.routes : [];
            const routeDistinguisher = String(rd.rd || '');

            for (const route of routes) {
                const network = route.network || '';
                const destination_mask = network || '';
                
                routesToUpsert.push({
                    device: context.device,
                    snapshot: context.snapshot,
                    interface: null,
                    destination_mask: destination_mask,
                    protocol: 'BGP',
                    preference: 0,
                    cost: 0,
                    flags: route.status || '',
                    next_hop: route.next_hop || '',
                    status: route.status || null,
                    network: route.network || null,
                    prefix_len: null,
                    loc_prf: route.loc_prf || null,
                    med: route.med ? String(route.med) : null,
                    pref_val: route.pref_val || null,
                    path_ogn: route.path_ogn || null,
                    label: route.label || null,
                    route_distinguisher: routeDistinguisher,
                    vpn_instance: null,
                });
            }
        }

        if (routesToUpsert.length > 0) {
            await this.routeRepo.upsert(routesToUpsert);
            console.log(`[BgpVpnv4RoutingTableIngestor] Upserted ${routesToUpsert.length} VPNv4 routes.`);
        }
    }
}

