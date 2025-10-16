import "reflect-metadata";
import { Container } from "inversify";
import { DataSource } from "typeorm";
import { AppDataSource } from "./database/data-source";
import { DeviceRepository, IDeviceRepository } from "./repositories/DeviceRepository";
import { DeviceService, IDeviceService } from "./services/device/DeviceService";
import { DeviceHandler } from "./handlers/DeviceHandler";
import { TYPES } from "./types";
import { IOptionRepository } from "./repositories/OptionRepository";
import { OptionRepository } from "./repositories/OptionRepository";
import { DefaultOptionsSeeder } from "./services/seeders/OptionsSeeder";
import { ConfigurationService, IConfigurationService } from "./services/config/ConfigurationService";
import { ParsingHandler } from "./handlers/ParsingHandler";
import RootFolderParsingService from "./services/parser/RootFolderParsingService";
import { LogsParserService } from "./services/parser/LogsParserService";
import { IAIClient } from "./services/ai-agent/client/IAIClient";
import { GeminiClient } from "./services/ai-agent/client/GeminiAIClient";
import { ISnapshotRepository, SnapshotRepository } from "./repositories/SnapshotRepository";
import { ITransceiverRepository, TransceiverRepository } from "./repositories/TransceiverRepository";
import { IInterfaceRepository, InterfaceRepository } from "./repositories/InterfaceRepository";
import {AIPromptBuilder} from "./services/ai-agent/AIPromptBuilder";
import {AIAgent} from "./services/ai-agent/AIAgent";

const container = new Container();

// Bind DataSource
container.bind<DataSource>(TYPES.DataSource).toConstantValue(AppDataSource);

// Bind Repository
container.bind<IDeviceRepository>(TYPES.DeviceRepository).to(DeviceRepository);
container.bind<IOptionRepository>(TYPES.OptionRepository).to(OptionRepository);
container.bind<ISnapshotRepository>(TYPES.SnapshotRepository).to(SnapshotRepository);
container.bind<ITransceiverRepository>(TYPES.TransceiverRepository).to(TransceiverRepository);
container.bind<IInterfaceRepository>(TYPES.InterfaceRepository).to(InterfaceRepository);

// Bind Service
container.bind<IDeviceService>(TYPES.DeviceService).to(DeviceService);
container.bind<DefaultOptionsSeeder>(TYPES.DefaultOptionsSeeder).to(DefaultOptionsSeeder);
container.bind<IConfigurationService>(TYPES.ConfigurationService).to(ConfigurationService);
container.bind<RootFolderParsingService>(TYPES.RootFolderParsingService).to(RootFolderParsingService);
container.bind<LogsParserService>(TYPES.LogsParserService).to(LogsParserService);
container.bind<IAIClient>(TYPES.AIClient).to(GeminiClient).inSingletonScope();
container.bind<AIPromptBuilder>(TYPES.AIPromptBuilder).to(AIPromptBuilder);
container.bind<AIAgent>(TYPES.AIAgent).to(AIAgent);

// Bind Handler
container.bind<DeviceHandler>(DeviceHandler).toSelf();
container.bind<ParsingHandler>(ParsingHandler).toSelf();

export { container };
