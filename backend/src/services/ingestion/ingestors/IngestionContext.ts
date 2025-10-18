import {Snapshot} from "../../../models/Snapshot";
import {Device} from "../../../models/Device";
import {Interface} from "../../../models/Interface";

export class IngestionContext {
    public readonly snapshot: Snapshot;
    public readonly device: Device;

    public readonly interfaceCache: Map<string, Interface>;

    constructor(snapshot: Snapshot, device: Device) {
        this.snapshot = snapshot;
        this.device = device;
        this.interfaceCache = new Map<string, Interface>();
    }
}