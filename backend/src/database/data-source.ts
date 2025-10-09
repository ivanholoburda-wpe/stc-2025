import "reflect-metadata";
import { DataSource } from "typeorm";
import path from "path";
import { app } from "electron";
import { Snapshot } from "../models/Snapshot";
import { Device } from "../models/Device";
import { Interface } from "../models/Interface";
import { Transceiver } from "../models/Transceiver";
import { DeviceNeighbor } from "../models/DeviceNeighbor";

const dbPath = path.join(app.getPath("userData"), "local.db");
const migrationsPath = path.resolve(__dirname, '..', 'migrations', '*.js');;

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: dbPath,
  synchronize: false,
  logging: true,
  entities: [Snapshot, Device, Interface, Transceiver, DeviceNeighbor],
  migrations: [migrationsPath],
});