import { injectable, inject } from "inversify";
import { Device } from "../../models/Device";
import { IDeviceRepository } from "../../repositories/DeviceRepository";
import { TYPES } from "../../types"

export interface IDeviceService {
  getAllDevices(): Promise<Device[]>;
  getDeviceById(id: number): Promise<Device | null>;
  createDevice(deviceData: Partial<Device>): Promise<Device>;
  updateDevice(id: number, deviceData: Partial<Device>): Promise<Device | null>;
  deleteDevice(id: number): Promise<boolean>;
}

@injectable()
export class DeviceService implements IDeviceService {
  constructor(
    @inject(TYPES.DeviceRepository) private deviceRepository: IDeviceRepository
  ) {}

  async getAllDevices(): Promise<Device[]> {
    return await this.deviceRepository.findAll();
  }

  async getDeviceById(id: number): Promise<Device | null> {
    return await this.deviceRepository.findById(id);
  }

  async createDevice(deviceData: Partial<Device>): Promise<Device> {
    return await this.deviceRepository.create(deviceData);
  }

  async updateDevice(id: number, deviceData: Partial<Device>): Promise<Device | null> {
    return await this.deviceRepository.update(id, deviceData);
  }

  async deleteDevice(id: number): Promise<boolean> {
    return await this.deviceRepository.delete(id);
  }
}
