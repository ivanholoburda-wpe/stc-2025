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

        const routesToUpsert: any[] = [];

        for (const route of routes) {
            const interfaceName = String(route.interface);
            const parentInterface = context.interfaceCache.get(interfaceName);

            const baseDestination = route.destination_mask || route.network || '';

            // Primary path
            routesToUpsert.push({
                device: context.device,
                snapshot: context.snapshot,
                interface: parentInterface || null,

                destination_mask: baseDestination,
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
            });

            // Secondary ECMP/backup paths (if any)
            const secondary = Array.isArray((route as any).secondary_paths) ? (route as any).secondary_paths : [];
            for (const sp of secondary) {
                const spInterfaceName = String(sp.interface ?? '');
                const spParentInterface = spInterfaceName ? context.interfaceCache.get(spInterfaceName) : undefined;
                routesToUpsert.push({
                    device: context.device,
                    snapshot: context.snapshot,
                    interface: spParentInterface || null,

                    destination_mask: baseDestination,
                    protocol: sp.protocol || route.protocol || 'BGP',
                    preference: sp.preference ?? route.preference ?? 0,
                    cost: sp.cost ?? route.cost ?? 0,
                    flags: sp.flags || route.flags || route.status || '',
                    next_hop: sp.next_hop,
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
                });
            }
        }

        if (routesToUpsert.length > 0) {
            await this.routeRepo.upsert(routesToUpsert);
            console.log(`[IpRouteIngestor] Upserted ${routesToUpsert.length} IP routes (incl. secondary paths if present).`);
        }
    }
}