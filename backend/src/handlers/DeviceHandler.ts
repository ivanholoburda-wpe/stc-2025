import {injectable, inject} from "inversify";
import {IDeviceService} from "../services/device/DeviceService";
import {TYPES} from "../types";

@injectable()
export class DeviceHandler {
    constructor(
        @inject(TYPES.DeviceService) private deviceService: IDeviceService
    ) {
    }

    async getAllDevices() {
        try {
            const devices = await this.deviceService.getAllDevices();
            return {
                success: true,
                data: devices,
                count: devices.length
            };
        } catch (error) {
            return {
                success: false,
                error: (error as Error).message
            };
        }
    }

    async getDeviceById(id: number) {
        try {
            const device = await this.deviceService.getDeviceById(id);
            if (!device) {
                return {
                    success: false,
                    error: "Device not found"
                };
            }
            return {
                success: true,
                data: device
            };
        } catch (error) {
            return {
                success: false,
                error: (error as Error).message
            };
        }
    }

    async createDevice(deviceData: any) {
        try {
            const device = await this.deviceService.createDevice(deviceData);
            return {
                success: true,
                data: device
            };
        } catch (error) {
            return {
                success: false,
                error: (error as Error).message
            };
        }
    }

    async getDetailsForSummary(deviceId: number, snapshotId: number) {
        try {
            const device = await this.deviceService.getDetailsForSummary(deviceId, snapshotId);
            return {success: true, data: device};
        } catch (error) {
            return {success: false, error: (error as Error).message};
        }
    }

    async getInterfacesForDevice(deviceId: number, snapshotId: number) {
        try {
            const device = await this.deviceService.getDetailsWithInterfaces(deviceId, snapshotId);
            // Повертаємо тільки масив інтерфейсів, як очікує фронтенд
            return {success: true, data: device?.interfaces || []};
        } catch (error) {
            return {success: false, error: (error as Error).message};
        }
    }

    async getRoutingForDevice(deviceId: number, snapshotId: number) {
        try {
            const device = await this.deviceService.getDetailsWithRouting(deviceId, snapshotId);
            return {
                success: true,
                data: {
                    ipRoutes: device?.ipRoutes || [],
                    arpRecords: device?.arpRecords || []
                }
            };
        } catch (error) {
            return {success: false, error: (error as Error).message};
        }
    }

    async getProtocolsForDevice(deviceId: number, snapshotId: number) {
        try {
            const device = await this.deviceService.getDetailsWithProtocols(deviceId, snapshotId);
            return {
                success: true,
                data: {
                    bgpPeers: device?.bgpPeers || [],
                    ospfDetails: device?.ospfInterfaceDetails || [],
                    isisPeers: device?.isisPeers || [],
                    bfdSessions: device?.bfdSessions || []
                }
            };
        } catch (error) {
            return {success: false, error: (error as Error).message};
        }
    }

    async getHardwareForDevice(deviceId: number, snapshotId: number) {
        try {
            const device = await this.deviceService.getDetailsWithHardware(deviceId, snapshotId);
            return {success: true, data: device?.hardwareComponents || []};
        } catch (error) {
            return {success: false, error: (error as Error).message};
        }
    }

    async getVpnForDevice(deviceId: number, snapshotId: number) {
        try {
            const device = await this.deviceService.getDetailsWithVpn(deviceId, snapshotId);
            return {
                success: true,
                data: {
                    mplsL2vcs: device?.mplsL2vcs || [],
                    vpnInstances: device?.vpnInstances || [],
                    vxlanTunnels: device?.vxlanTunnels || []
                }
            };
        } catch (error) {
            return {success: false, error: (error as Error).message};
        }
    }

    async getVlansForDevice(deviceId: number, snapshotId: number) {
        try {
            const device = await this.deviceService.getDetailsWithVlans(deviceId, snapshotId);
            return {success: true, data: device?.vlans || []};
        } catch (error) {
            return {success: false, error: (error as Error).message};
        }
    }

    async getEthTrunksForDevice(deviceId: number, snapshotId: number) {
        try {
            const device = await this.deviceService.getDetailsWithEthTrunks(deviceId, snapshotId);
            return {success: true, data: device?.ethTrunks || []};
        } catch (error) {
            return {success: false, error: (error as Error).message};
        }
    }

    async getPortVlansForDevice(deviceId: number, snapshotId: number) {
        try {
            const device = await this.deviceService.getDetailsWithPortVlans(deviceId, snapshotId);
            return {success: true, data: device?.portVlans || []};
        } catch (error) {
            return {success: false, error: (error as Error).message};
        }
    }

    async getETrunksForDevice(deviceId: number, snapshotId: number) {
        try {
            const device = await this.deviceService.getDetailsWithETrunks(deviceId, snapshotId);
            return {success: true, data: device?.etrunks || []};
        } catch (error) {
            return {success: false, error: (error as Error).message};
        }
    }
}
