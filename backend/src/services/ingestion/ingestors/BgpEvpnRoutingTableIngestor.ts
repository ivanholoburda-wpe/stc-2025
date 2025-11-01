import "reflect-metadata";
import { injectable, inject } from "inversify";
import { IIngestor } from "./IIngestor";
import { IngestionContext } from "./IngestionContext";
import { ParserBlock } from "./types";
import {TYPES} from "../../../types";
import {IIpRouteRepository} from "../../../repositories/IpRouteRepository";

@injectable()
export class BgpEvpnRoutingTableIngestor implements IIngestor {
    readonly blockType = "display_bgp_evpn_routing_table_block";
    readonly priority = 163;

    constructor(
        @inject(TYPES.IpRouteRepository) private routeRepo: IIpRouteRepository
    ) {}

    async ingest(block: ParserBlock, context: IngestionContext): Promise<void> {
        const evpnAddressFamily = block?.evpn_address_family;
        if (!evpnAddressFamily) return;

        const routeDistinguishers = Array.isArray(evpnAddressFamily.route_distinguishers) 
            ? evpnAddressFamily.route_distinguishers 
            : [];
        const evpnInstances = Array.isArray(block?.evpn_instances) 
            ? block.evpn_instances 
            : [];

        const routesToUpsert: any[] = [];

        // Process route distinguishers
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
                    protocol: 'BGP EVPN',
                    preference: 0,
                    cost: 0,
                    flags: route.status || '',
                    next_hop: route.next_hop || '',
                    status: route.status || null,
                    network: route.network || null,
                    prefix_len: null,
                    loc_prf: null,
                    med: null,
                    pref_val: null,
                    path_ogn: null,
                    label: null,
                    route_distinguisher: routeDistinguisher,
                    vpn_instance: null,
                });
            }
        }

        // Process EVPN instances
        for (const evpnInstance of evpnInstances) {
            const routes = Array.isArray(evpnInstance.routes) ? evpnInstance.routes : [];
            const instanceName = String(evpnInstance.name || '');

            for (const route of routes) {
                const network = route.network || '';
                const destination_mask = network || '';
                
                routesToUpsert.push({
                    device: context.device,
                    snapshot: context.snapshot,
                    interface: null,
                    destination_mask: destination_mask,
                    protocol: 'BGP EVPN',
                    preference: 0,
                    cost: 0,
                    flags: route.status || '',
                    next_hop: route.next_hop || '',
                    status: route.status || null,
                    network: route.network || null,
                    prefix_len: null,
                    loc_prf: null,
                    med: null,
                    pref_val: null,
                    path_ogn: null,
                    label: null,
                    route_distinguisher: null,
                    vpn_instance: instanceName,
                });
            }
        }

        if (routesToUpsert.length > 0) {
            await this.routeRepo.upsert(routesToUpsert);
            console.log(`[BgpEvpnRoutingTableIngestor] Upserted ${routesToUpsert.length} EVPN routes.`);
        }
    }
}

