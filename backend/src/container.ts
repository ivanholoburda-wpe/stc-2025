import "reflect-metadata";
import { Container } from "inversify";
import { DataSource } from "typeorm";
import { AppDataSource } from "./database/data-source";
import { DeviceRepository, IDeviceRepository } from "./repositories/DeviceRepository";
import { DeviceService, IDeviceService } from "./services/DeviceService";
import { DeviceHandler } from "./handlers/DeviceHandler";
import { TYPES } from "./types";
import { IOptionRepository } from "./repositories/OptionRepository";
import { OptionRepository } from "./repositories/OptionRepository";
import { DefaultOptionsSeeder } from "./services/seeders/OptionsSeeder";
import { ConfigurationService, IConfigurationService } from "./services/ConfigurationService";

const container = new Container();

// Bind DataSource
container.bind<DataSource>(TYPES.DataSource).toConstantValue(AppDataSource);

// Bind Repository
container.bind<IDeviceRepository>(TYPES.DeviceRepository).to(DeviceRepository);
container.bind<IOptionRepository>(TYPES.OptionRepository).to(OptionRepository)

// Bind Service
container.bind<IDeviceService>(TYPES.DeviceService).to(DeviceService);
container.bind<DefaultOptionsSeeder>(TYPES.DefaultOptionsSeeder).to(DefaultOptionsSeeder);
container.bind<IConfigurationService>(TYPES.ConfigurationService).to(ConfigurationService);

// Bind Handler
container.bind<DeviceHandler>(DeviceHandler).toSelf();

export { container };
