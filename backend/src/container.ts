import "reflect-metadata";
import { Container } from "inversify";
import { DataSource } from "typeorm";
import { AppDataSource } from "./database/data-source";
import { DeviceRepository, IDeviceRepository } from "./repositories/DeviceRepository";
import { DeviceService, IDeviceService } from "./services/DeviceService";
import { DeviceHandler } from "./handlers/DeviceHandler";
import { TYPES } from "./types";

const container = new Container();

// Bind DataSource
container.bind<DataSource>(TYPES.DataSource).toConstantValue(AppDataSource);

// Bind Repository
container.bind<IDeviceRepository>(TYPES.DeviceRepository).to(DeviceRepository);

// Bind Service
container.bind<IDeviceService>(TYPES.DeviceService).to(DeviceService);

// Bind Handler
container.bind<DeviceHandler>(DeviceHandler).toSelf();

export { container };
