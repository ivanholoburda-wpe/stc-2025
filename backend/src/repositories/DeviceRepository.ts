import { injectable, inject } from "inversify";
import { Repository, DataSource } from "typeorm";
import { Device } from "../models/Device";
import { TYPES } from "../types";

export interface IDeviceRepository {
  findAll(): Promise<Device[]>;
  findById(id: number): Promise<Device | null>;
  findByHostname(hostname: string): Promise<Device | null>;
  create(device: Partial<Device>): Promise<Device>;
  update(id: number, device: Partial<Device>): Promise<Device | null>;
  delete(id: number): Promise<boolean>;
}

@injectable()
export class DeviceRepository implements IDeviceRepository {
  private repository: Repository<Device>;

  constructor(@inject(TYPES.DataSource) private dataSource: DataSource) {
    this.repository = dataSource.getRepository(Device);
  }

  async findAll(): Promise<Device[]> {
    return await this.repository.find({
      relations: ["firstSeenSnapshot", "interfaces", "transceivers"]
    });
  }

  async findById(id: number): Promise<Device | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ["firstSeenSnapshot", "interfaces", "transceivers"]
    });
  }

  async findByHostname(hostname: string): Promise<Device | null> {
    return await this.repository.findOne({
      where: { hostname },
      relations: ["firstSeenSnapshot", "interfaces", "transceivers"]
    });
  }

  async create(device: Partial<Device>): Promise<Device> {
    const newDevice = this.repository.create(device);
    return await this.repository.save(newDevice);
  }

  async update(id: number, device: Partial<Device>): Promise<Device | null> {
    await this.repository.update(id, device);
    return await this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    const result = await this.repository.delete(id);
    return (result.affected ?? 0) > 0;
  }
}
