import "reflect-metadata";
import { DataSource } from "typeorm";
import path from "path";
import { app } from "electron";
import { Snapshot } from "../models/Snapshot";
import { Device } from "../models/Device";
import { Interface } from "../models/Interface";
import { Transceiver } from "../models/Transceiver";
import { DeviceNeighbor } from "../models/DeviceNeighbor";
import { Option } from "../models/Option";

const dbPath = "./local.db";
const migrationsPath = path.resolve(__dirname, '..', 'migrations', '*.js');;

export const AppDataSource = new DataSource({
  type: "sqlite",
  database: dbPath,
  synchronize: false,
  logging: true,
  entities: [Snapshot, Device, Interface, Transceiver, DeviceNeighbor, Option],
  migrations: [migrationsPath],
});