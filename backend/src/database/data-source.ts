import "reflect-metadata";
import { DataSource } from "typeorm";
import path from "path";
import { Snapshot } from "../models/Snapshot";
import { Device } from "../models/Device";
import { Interface } from "../models/Interface";
import { Transceiver } from "../models/Transceiver";
import { DeviceNeighbor } from "../models/DeviceNeighbor";
import { Option } from "../models/Option";


const dbPath = path.join(process.cwd(), "local.db");

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: dbPath,
  synchronize: false,
  logging: true,
  entities: [Snapshot, Device, Interface, Transceiver, DeviceNeighbor],
  migrations: [path.join(process.cwd(), "backend", "src", "migrations", "*.ts")],
});