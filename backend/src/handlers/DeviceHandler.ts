import { injectable, inject } from "inversify";
import { IDeviceService } from "../services/device/DeviceService";
import { TYPES } from "../types";

@injectable()
export class DeviceHandler {
  constructor(
    @inject(TYPES.DeviceService) private deviceService: IDeviceService
  ) {}

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
}
